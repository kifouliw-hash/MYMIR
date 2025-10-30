import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "✅ Route SIRET (OpenDataSoft - version stable) opérationnelle" });
});

router.post("/lookup", async (req, res) => {
  try {
    const { siret } = req.body;
    if (!siret || siret.length !== 14) {
      return res.status(400).json({ message: "SIRET invalide (14 chiffres requis)." });
    }

    // ✅ Nouvelle URL OpenDataSoft : recherche par mot-clé "q="
    const odsUrl = `https://public.opendatasoft.com/api/records/1.0/search/?dataset=sirene-v3&q=${encodeURIComponent(siret)}&rows=1`;

    console.log("🌍 Tentative OpenDataSoft:", odsUrl);

    const response = await fetch(odsUrl, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error("⚠️ OpenDataSoft erreur HTTP:", response.status);
      return res.status(502).json({ message: `Erreur côté OpenDataSoft (${response.status})` });
    }

    const json = await response.json();
    if (!json.records || json.records.length === 0) {
      console.log("🔁 Aucun résultat OpenDataSoft — fallback vers data.gouv.fr");
      const dgUrl = `https://entreprise.data.gouv.fr/api/sirene/v3/etablissements/${siret}`;
      const dgResp = await fetch(dgUrl, { headers: { Accept: "application/json" } });
      if (!dgResp.ok) {
        return res.status(502).json({ message: "API SIRENE indisponible (fallback)" });
      }

      const dgData = await dgResp.json();
      if (!dgData || !dgData.etablissement) {
        return res.status(404).json({ message: "Aucun établissement trouvé pour ce SIRET." });
      }

      const e = dgData.etablissement;
      const companyName = e.unite_legale?.denomination || e.unite_legale?.nom || "Entreprise inconnue";
      const naf = e.unite_legale?.activite_principale || "Non renseigné";
      const city = e.libelle_commune || "—";
      return res.json({ company: companyName, naf, city, country: "France" });
    }

    // ✅ Lecture du résultat OpenDataSoft
    const fields = json.records[0].fields;
    const companyName =
      fields.denomination_unite_legale ||
      fields.nom_commercial ||
      fields.label_entreprise ||
      "Entreprise inconnue";

    const naf =
      fields.activite_principale ||
      fields.activite_principale_registremetier ||
      fields.code_naf ||
      "Non renseigné";

    const city = fields.libelle_commune || fields.commune || "—";

    res.json({
      company: companyName,
      naf,
      city,
      country: "France",
    });
  } catch (err) {
    console.error("❌ Erreur API SIRET :", err);
    res.status(500).json({
      message: "Erreur serveur ou API SIRENE indisponible.",
      details: err.message,
    });
  }
});

export default router;
