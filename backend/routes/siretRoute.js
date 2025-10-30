import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// ✅ Test route (Render ok)
router.get("/test", (req, res) => {
  res.json({ message: "✅ Route SIRET opérationnelle via Proxy" });
});

// ✅ Route principale avec Proxy pour Render
router.post("/lookup", async (req, res) => {
  try {
    const { siret } = req.body;
    if (!siret || siret.length !== 14) {
      return res.status(400).json({ message: "SIRET invalide (14 chiffres requis)." });
    }

    // 🔄 On passe par un proxy relais (hébergé sur serveur public fiable)
    const proxyURL = `https://api.allorigins.win/get?url=${encodeURIComponent(
      `https://entreprise.data.gouv.fr/api/sirene/v3/etablissements/${siret}`
    )}`;

    console.log("🌐 Requête proxy envoyée à :", proxyURL);

    const proxyRes = await fetch(proxyURL);
    if (!proxyRes.ok) {
      return res.status(502).json({ message: `Erreur proxy (${proxyRes.status})` });
    }

    const proxyData = await proxyRes.json();

    if (!proxyData || !proxyData.contents) {
      return res.status(502).json({ message: "Réponse proxy invalide." });
    }

    const data = JSON.parse(proxyData.contents);

    if (!data || !data.etablissement) {
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
    console.error("❌ Erreur API SIRET via proxy :", err);
    res.status(500).json({
      message: "Erreur serveur ou proxy indisponible.",
      details: err.message,
    });
  }
});

export default router;
