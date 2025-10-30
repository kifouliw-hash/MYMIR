import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// ✅ Test route
router.get("/test", (req, res) => {
  res.json({ message: "✅ Route SIRET (Pappers API) opérationnelle" });
});

// ✅ Lookup SIRET avec fallback OpenDataSoft (optionnel)
router.post("/lookup", async (req, res) => {
  try {
    const { siret } = req.body;
    if (!siret || siret.length !== 14) {
      return res.status(400).json({ message: "SIRET invalide (14 chiffres requis)." });
    }

    console.log("🔍 Recherche du SIRET via Pappers :", siret);

    // 1️⃣ Appel principal à l’API Pappers
    const url = `https://api.pappers.fr/v2/recherche?api_token=demo&par_page=1&q=${siret}`;
    const response = await fetch(url, { headers: { Accept: "application/json" } });

    if (!response.ok) {
      console.error("⚠️ Erreur Pappers:", response.status, response.statusText);
      return res.status(502).json({ message: `Erreur API Pappers (${response.status})` });
    }

    const data = await response.json();
    console.log("📦 Réponse brute Pappers :", data);

    if (!data.resultats || data.resultats.length === 0) {
      return res.status(404).json({ message: "Aucune entreprise trouvée pour ce SIRET." });
    }

    const result = data.resultats[0];

    const company = result.nom_entreprise || result.nom || "Entreprise inconnue";
    const naf = result.activite_principale || result.code_naf || "Non renseigné";
    const city = result.ville || "—";
    const country = "France";

    res.json({ company, naf, city, country });
  } catch (err) {
    console.error("❌ Erreur serveur lookup SIRET:", err);
    res.status(500).json({
      message: "Erreur interne lors de la recherche du SIRET.",
      details: err.message,
    });
  }
});

export default router;
