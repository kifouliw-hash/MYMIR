// === Route API : Recherche SIRET ===
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// ✅ Test route (pour vérifier Render)
router.get("/test", (req, res) => {
  res.json({ message: "✅ Route SIRET opérationnelle sur Render" });
});

// ✅ Route POST : /api/siret/lookup
router.post("/lookup", async (req, res) => {
  try {
    const { siret } = req.body;

    if (!siret || siret.length !== 14) {
      return res.status(400).json({ message: "SIRET invalide (14 chiffres requis)." });
    }

    const url = `https://entreprise.data.gouv.fr/api/sirene/v3/etablissements/${siret}`;

    console.log("🔍 Requête API SIRENE envoyée à :", url);

    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      console.error("⚠️ API SIRENE a renvoyé une erreur :", response.status, response.statusText);
      return res.status(502).json({
        message: `Erreur côté API SIRENE (${response.status})`,
      });
    }

    const data = await response.json();

    if (!data || !data.etablissement) {
      console.warn("⚠️ Aucun établissement trouvé pour ce SIRET.");
      return res.status(404).json({ message: "Aucun établissement trouvé pour ce SIRET." });
    }

    const etab = data.etablissement;
    const companyName = etab.unite_legale?.denomination || etab.unite_legale?.nom || "Entreprise inconnue";
    const naf = etab.unite_legale?.activite_principale || "Non renseigné";
    const city = etab.libelle_commune || "—";
    const country = "France";

    res.json({
      company: companyName,
      naf,
      city,
      country,
    });

  } catch (err) {
    console.error("❌ Erreur API SIRET détaillée :", err);
    res.status(500).json({
      message: "Erreur serveur ou API SIRENE indisponible.",
      details: err.message,
    });
  }
});

export default router;
