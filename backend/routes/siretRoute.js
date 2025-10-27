import express from "express";
import fetch from "node-fetch"; // utile si Node <18 (Render l’a souvent inclus)

const router = express.Router();

// === Recherche entreprise via SIRET ===
router.post("/lookup", async (req, res) => {
  try {
    const { siret } = req.body;
    if (!siret) {
      return res.status(400).json({ message: "SIRET manquant." });
    }

    const apiUrl = `https://entreprise.data.gouv.fr/api/sirene/v3/etablissements/${siret}`;
    const r = await fetch(apiUrl);
    if (!r.ok) {
      return res.status(404).json({ message: "Aucune entreprise trouvée pour ce SIRET." });
    }

    const data = await r.json();
    const etab = data.etablissement;

    const result = {
      company: etab.unite_legale?.denomination || etab.unite_legale?.nom || "Entreprise inconnue",
      address: [
        etab.numero_voie,
        etab.type_voie,
        etab.libelle_voie,
        etab.code_postal,
        etab.libelle_commune,
      ].filter(Boolean).join(" "),
      naf: etab.unite_legale?.activite_principale || "",
      employees: etab.unite_legale?.tranche_effectifs || "",
      country: "France",
    };

    res.json(result);
  } catch (error) {
    console.error("Erreur API SIRET:", error);
    res.status(500).json({ message: "Erreur interne lors de la recherche SIRET." });
  }
});

export default router;

