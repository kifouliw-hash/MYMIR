// === Route API : Recherche SIRET ===
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Route POST : /api/siret/lookup
router.post("/lookup", async (req, res) => {
  try {
    const { siret } = req.body;

    if (!siret || siret.length !== 14) {
      return res.status(400).json({ message: "SIRET invalide (14 chiffres requis)." });
    }

    // Requête vers l'API publique SIRENE
    const url = `https://entreprise.data.gouv.fr/api/sirene/v3/etablissements/${siret}`;
    const response = await fetch(url);
    const data = await response.json();

    // Vérification des résultats
    if (!data || !data.etablissement) {
      return res.status(404).json({ message: "Aucun établissement trouvé pour ce SIRET." });
    }

    const etab = data.etablissement;
    const companyName = etab.unite_legale?.denomination || etab.unite_legale?.nom || "Entreprise inconnue";
    const naf = etab.unite_legale?.activite_principale || "Non renseigné";
    const city = etab.libelle_commune || "—";
    const country = "France";

    // ✅ Réponse simplifiée
    res.json({
      company: companyName,
      naf,
      city,
      country
    });

  } catch (err) {
    console.error("Erreur API SIRET :", err);
    res.status(500).json({ message: "Erreur serveur ou API SIRENE indisponible." });
  }
});
// === Route GET de test simple ===
router.get("/test", (req, res) => {
  res.json({ message: "✅ Route SIRET opérationnelle sur Render" });
});

export default router;
