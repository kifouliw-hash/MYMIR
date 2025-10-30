// backend/routes/siretRoute.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Test simple
router.get("/test", (req, res) => {
  res.json({ message: "✅ Route SIRET (OpenDataSoft) opérationnelle" });
});

/**
 * POST /api/siret/lookup
 * Body: { siret: "14chiffres" }
 */
router.post("/lookup", async (req, res) => {
  try {
    const { siret } = req.body;
    if (!siret || typeof siret !== "string" || siret.length !== 14) {
      return res.status(400).json({ message: "SIRET invalide (14 chiffres requis)." });
    }

    // 1) Première tentative : OpenDataSoft (sera généralement accessible depuis Render)
    const odsUrl = `https://public.opendatasoft.com/api/records/1.0/search/?dataset=sirene-v3&refine=siret=${encodeURIComponent(
      siret
    )}&rows=1`;

    console.log("🌍 Tentative OpenDataSoft:", odsUrl);

    let response = await fetch(odsUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "MyMirApp/1.0 (contact@mymir.com)",
      },
      // timeout handling could be added with AbortController if nécessaire
    });

    if (!response.ok) {
      console.warn("⚠️ OpenDataSoft a renvoyé un status:", response.status);
    }

    let json = null;
    try {
      json = await response.json();
    } catch (e) {
      console.warn("⚠️ Impossible de parser la réponse OpenDataSoft:", e.message);
      json = null;
    }

    // 2) Si OpenDataSoft n'a pas renvoyé d'info, on tente data.gouv.fr en fallback
    if (!json || !json.records || json.records.length === 0) {
      console.log("🔁 OpenDataSoft vide — tentative fallback vers entreprise.data.gouv.fr");

      const dgUrl = `https://entreprise.data.gouv.fr/api/sirene/v3/etablissements/${siret}`;
      try {
        const dgResp = await fetch(dgUrl, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "MyMirApp/1.0 (contact@mymir.com)",
          },
        });

        if (!dgResp.ok) {
          console.warn("⚠️ data.gouv.fr a renvoyé:", dgResp.status);
          return res.status(502).json({ message: "API externe indisponible (fallback)." });
        }

        const dgJson = await dgResp.json();
        if (!dgJson || !dgJson.etablissement) {
          return res.status(404).json({ message: "Aucun établissement trouvé pour ce SIRET." });
        }

        const e = dgJson.etablissement;
        const companyName = e.unite_legale?.denomination || e.unite_legale?.nom || "Entreprise inconnue";
        const naf = e.unite_legale?.activite_principale || "Non renseigné";
        const city = e.libelle_commune || "—";
        const country = "France";

        return res.json({
          company: companyName,
          naf,
          city,
          country,
        });
      } catch (err) {
        console.error("❌ Erreur fallback data.gouv.fr :", err);
        return res.status(500).json({ message: "Erreur lors de la récupération des données (fallback).", details: err.message });
      }
    }

    // 3) Si OpenDataSoft a renvoyé un enregistrement, on l'utilise
    const record = json.records[0];
    const fields = record.fields || {};

    // Structure possible selon OpenDataSoft Sirene v3 dataset
    // champs utiles : denomination_unite_legale, nom_commercial, activite_principale_registremetier (ou naf), libelle_commune
    const companyName =
      fields.denomination_unite_legale ||
      fields.nom_commercial ||
      fields.label_entreprise ||
      fields.unite_legale?.denomination || "Entreprise inconnue";

    // NAF peut être dans plusieurs champs ; on essaye les plus courants
    const naf =
      fields.activite_principale ||
      fields.activite_principale_registremetier ||
      fields.unite_legale?.activite_principale ||
      fields.code_naf || "Non renseigné";

    const city = fields.libelle_commune || fields.commune || (fields.adresse && fields.adresse.libelle_commune) || "—";
    const country = "France";

    return res.json({
      company: companyName,
      naf,
      city,
      country,
      raw: {
        ods_record_id: record.recordid,
      },
    });
  } catch (err) {
    console.error("❌ Erreur API SIRET (route):", err);
    res.status(500).json({
      message: "Erreur serveur lors de la recherche SIRET.",
      details: err.message,
    });
  }
});

export default router;
