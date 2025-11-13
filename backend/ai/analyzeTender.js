// backend/ai/analyzeTender.js
import fs from "fs";
import OpenAI from "openai";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import jwt from "jsonwebtoken";
import pool from "../../db.js";

const openai = new OpenAI({ apiKey: process.env.***REMOVED*** });

// ===============================================
// 🔍 Extraction du texte depuis un PDF
// ===============================================
async function extractTextFromPDF(filePath) {
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdf = await loadingTask.promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + "\n";
    }

    if (!text.trim()) throw new Error("PDF vide ou non lisible");
    return text;
  } catch (err) {
    console.error("❌ Erreur lecture PDF :", err);
    throw new Error("Impossible de lire le PDF — format non compatible ou corrompu");
  }
}

// ===============================================
// 🧠 Analyse IA MyMír (avec PROFIL UTILISATEUR)
// ===============================================
export async function analyzeTender(filePath, token) {
  try {
    console.log("📄 Lecture du PDF :", filePath);
    const extractedText = await extractTextFromPDF(filePath);

    // ===============================================
    // 🔐 Récupération du profil utilisateur
    // ===============================================
    let profilEntreprise = {
      companyName: "Non renseigné",
      sector: "Non précisé",
      revenue: "Non précisé",
      effectif: "Non précisé",
      country: "Non précisé",
      certifications: "Aucune"
    };

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecret");
        const userId = decoded.id;

        const { rows } = await pool.query(
          "SELECT metadata FROM users WHERE id = $1",
          [userId]
        );

        if (rows.length > 0) {
          profilEntreprise = rows[0].metadata || profilEntreprise;
        }
      } catch (err) {
        console.warn("⚠️ Impossible de charger le profil utilisateur :", err.message);
      }
    }

    console.log("🧩 Profil utilisé pour l'analyse :", profilEntreprise);

    // ===============================================
    // PROMPT IA — VERSION CONSULTANT EXPERT + PROFIL
    // ===============================================
    const prompt = `
Tu es MyMír, une IA experte en analyse d'appels d'offres.

Voici le **profil réel de l’entreprise** qui souhaite candidater :
${JSON.stringify(profilEntreprise, null, 2)}

Utilise ce profil de manière INTELLIGENTE pour :
- analyser la compatibilité réelle avec l’appel d’offre
- expliquer les points forts / points faibles
- évaluer si l’entreprise a des chances
- proposer un score réaliste
- faire des recommandations adaptées au VRAI profil

Analyse selon les sections suivantes :

1️⃣ IDENTIFICATION DU MARCHÉ
- Type de marché (public, privé, secteur, sous-secteur…)
- Objet du marché et finalité du projet
- Lieu ou zone géographique d’exécution
- Montant estimatif s’il est mentionné
- Date limite de dépôt
- Autorité contractante

2️⃣ EXIGENCES ET DOCUMENTS À FOURNIR
- Liste exhaustive des documents administratifs (DC1, DC2, assurance, bilan, références…)
- Exigences techniques
- Contraintes financières ou juridiques
- Certifications demandées (Qualibat, ISO, etc.)

3️⃣ COMPARAISON AVEC LE PROFIL ENTREPRISE
Profil entreprise :
${entrepriseProfil}

Analyse la correspondance entre l’appel d’offre et le profil ci-dessus :
- Points forts de l’entreprise pour ce marché
- Points faibles ou risques
- Ressources à mobiliser
- Compatibilité géographique, technique et financière

4️⃣ OPPORTUNITÉ ET SCORE
- Évalue la faisabilité et la pertinence de participer à ce marché.
- Donne un score de compatibilité sur 100 :
  - 0–49 : Risque élevé / peu compatible
  - 50–74 : Faisable avec ajustements
  - 75–89 : Bonne opportunité
  - 90–100 : Très forte compatibilité
Explique brièvement pourquoi tu donnes ce score.

5️⃣ RECOMMANDATIONS STRATÉGIQUES
- Conseils pratiques pour renforcer le dossier
- Actions à entreprendre avant dépôt
- Erreurs à éviter
- Pistes pour valoriser les points forts

6️⃣ PLAN DE DÉPÔT ET SUIVI
- Étapes à suivre jusqu’au dépôt final
- Portail ou site de dépôt s’il est mentionné
- Checklist finale (documents à joindre, formats, signatures)
- Phrase de rappel personnalisée

7️⃣ Checklist finale  

Voici le texte extrait du PDF :
${extractedText.slice(0, 15000)}

RENVOIE UNIQUEMENT DU JSON STRUCTURÉ :
{
  "titre": "",
  "type_marche": "",
  "autorite": "",
  "date_limite": "",
  "contexte": "",
  "documents_requis": [],
  "analyse_profil": "",
  "score": 0,
  "opportunite": "",
  "recommandations": [],
  "plan_de_depot": [],
  "checklist": []
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.25,
      messages: [
        { role: "system", content: "Tu es MyMír, IA experte en marchés publics." },
        { role: "user", content: prompt },
      ],
    });

    const analysis = completion.choices?.[0]?.message?.content || "Aucune analyse générée.";

    // Supprime le fichier PDF après traitement
    fs.unlinkSync(filePath);

    return {
      success: true,
      analysis,
      generated_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error("❌ Erreur complète analyzeTender :", err);
    return {
      success: false,
      message: "Erreur pendant l'analyse du document : " + (err.message || "Erreur inconnue."),
    };
  }
}
