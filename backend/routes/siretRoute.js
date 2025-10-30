import express from "express";
import fetch from "node-fetch";
import https from "https";

const router = express.Router();
const agent = new https.Agent({ rejectUnauthorized: false }); // ✅ pour Render

// ✅ Test route
router.get("/test", (req, res) => {
  res.json({ message: "✅ Route SIRET (Pappers API) opérationnelle" });
});

// ✅ Recherche par SIRET
router.post("/lookup", async (req, res) => {
  try {
    const { siret } = req.body;
    if (!siret || siret.length !== 14) {
      return res.status(400).json({ message: "SIRET invalide (14 chiffres requis)." });
    }

    // 🔑 Clé API Pappers injectée depuis Render
    const apiKey = process.env.PAPPERS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: "Clé API Pappers manquante sur le serveur." });
    }

    const url = `https://api.pappers.fr/v2/recherche?api_token=${apiKey}&par_page=1&q=${siret}`;
    console.log("🔍 Requête API Pappers :", url);

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      agent,
    });

    if (!response.ok) {
      console.error("⚠️ Erreur Pappers :", response.status, response.statusText);
      return res
        .status(response.status)
        .json({ message: `Erreur API Pappers (${response.status})` });
    }

    const data = await response.json();

    if (!data.resultats || data.resultats.length === 0) {
      return res.status(404).json({ message: "Aucune entreprise trouvée pour ce SIRET." });
    }

    const r = data.resultats[0];
    res.json({
      company: r.nom_entreprise || r.nom || "Entreprise inconnue",
      naf: r.activite_principale || r.code_naf || "Non renseigné",
      city: r.ville || "—",
      country: "France",
    });
  } catch (err) {
    console.error("❌ Erreur serveur lookup SIRET:", err);
    res.status(500).json({
      message: "Erreur interne lors de la recherche du SIRET.",
      details: err.message,
    });
  }
});

export default router;
