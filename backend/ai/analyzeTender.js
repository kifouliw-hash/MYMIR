// backend/ai/analyzeTender.js
import fs from "fs";
import OpenAI from "openai";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import jwt from "jsonwebtoken";
import pool from "../../db.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --------------------------------------------------
// 🔍 Extraction du texte PDF
// --------------------------------------------------
async function extractTextFromPDF(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((item) => item.str).join(" ") + "\n";
  }
  return text.trim();
}

// --------------------------------------------------
// 🧠 ANALYSE COMPLÈTE (avec sauvegarde automatique)
// --------------------------------------------------
export async function analyzeTender(filePath, token) {
  try {
    const extractedText = await extractTextFromPDF(filePath);

    // === 1️⃣ Charger le profil réel utilisateur
    let profilEntreprise = {
      companyName: "Non renseigné",
      sector: "Non précisé",
      revenue: "Non précisé",
      effectif: "Non précisé",
      country: "Non précisé",
      certifications: "Aucune"
    };

    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecret");
        userId = decoded.id;

        const { rows } = await pool.query(
          "SELECT metadata FROM users WHERE id = $1",
          [userId]
        );

        if (rows.length > 0) {
          profilEntreprise = rows[0].metadata || profilEntreprise;
        }
      } catch (err) {
        console.warn("⚠️ Profil non chargé :", err.message);
      }
    }

    console.log("🧩 Profil utilisé :", profilEntreprise);

    const prompt = `
Tu es MyMír, un assistant expert en appels d'offres publics et privés.
Ta mission est d'analyser le document fourni et de produire une synthèse complète, claire et exploitable.

Voici le **profil réel de l'entreprise** candidate :
${JSON.stringify(profilEntreprise, null, 2)}

Analyse selon les axes suivants :

1️⃣ IDENTIFICATION DU MARCHÉ
- Type de marché (public, privé, secteur, sous-secteur…)
- Objet du marché et finalité du projet
- Lieu ou zone géographique d'exécution
- Montant estimatif s'il est mentionné
- Date limite de dépôt
- Autorité contractante

2️⃣ EXIGENCES ET DOCUMENTS À FOURNIR
- Liste exhaustive des documents administratifs (DC1, DC2, assurance, bilan, références…)
- Exigences techniques
- Contraintes financières ou juridiques
- Certifications demandées (Qualibat, ISO, etc.)

3️⃣ COMPARAISON AVEC LE PROFIL ENTREPRISE
Analyse la correspondance entre l'appel d'offre et le profil ci-dessus :
- Points forts spécifiques de CETTE entreprise
- Points faibles ou risques
- Ressources à mobiliser
- Compatibilité géographique, technique et financière
- TON évaluation réaliste et contextualisée

4️⃣ OPPORTUNITÉ ET SCORE
- Évalue la faisabilité et la pertinence de participer
- Score de compatibilité sur 100 :
  - 0–49 = Risque élevé
  - 50–74 = Faisable avec ajustements
  - 75–89 = Bonne opportunité
  - 90–100 = Très forte compatibilité
- Explique clairement ton score

5️⃣ RECOMMANDATIONS STRATÉGIQUES
- Conseils pour renforcer le dossier
- Astuces pour améliorer la pertinence du profil
- Points à valoriser
- Erreurs à éviter

6️⃣ PLAN DE DÉPÔT ET SUIVI
- Étapes à suivre jusqu'au dépôt final
- Portail ou site s'il est mentionné
- Actions administratives
- Format des documents
- Points de vérification

7️⃣ CHECKLIST FINALE
Liste claire et prête à l'emploi

Voici le texte extrait du PDF :
${extractedText.slice(0, 15000)}

RENVOIE UNIQUEMENT DU JSON VALIDE :
{
  "title": "",
  "type_marche": "",
  "autorite": "",
  "date_limite": "",
  "contexte": "",
  "documents_requis": [],
  "analyse_profil": "",
  "score": 0,
  "opportunity": "",
  "recommendations": "",
  "plan_de_depot": [],
  "checklist": []
}
`;

    // --------------------------------------------------
    // 🔮 Requête IA
    // --------------------------------------------------
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.25,
      messages: [
        { role: "system", content: "Tu es MyMír, IA experte en marchés publics." },
        { role: "user", content: prompt }
      ],
    });

    let analysisText = completion.choices?.[0]?.message?.content || "{}";
    
    // Nettoyer le JSON (enlever les backticks markdown si présents)
    analysisText = analysisText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let analysisJson = {};
    try {
      analysisJson = JSON.parse(analysisText);
    } catch (e) {
      console.error("❌ Erreur parsing JSON:", e);
      analysisJson = { title: "Erreur parsing", score: 0, contexte: analysisText };
    }

    fs.unlinkSync(filePath);

    // 💾 SAUVEGARDE AUTOMATIQUE EN BASE
    if (userId) {
      try {
        const { rows } = await pool.query(
          `INSERT INTO analyses (user_id, title, score, summary, analysis, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING id`,
          [
            userId,
            analysisJson.title || "Sans titre",
            analysisJson.score || 0,
            analysisJson.contexte || "",
            JSON.stringify(analysisJson)
          ]
        );

        const savedId = rows[0].id;
        console.log(`✅ Analyse sauvegardée automatiquement - ID: ${savedId}`);

        return {
          success: true,
          _id: savedId,
          analysis: analysisJson,
          generated_at: new Date().toISOString(),
        };

      } catch (dbErr) {
        console.error("❌ Erreur sauvegarde DB:", dbErr);
      }
    }

    // Si pas de userId ou erreur DB, retourner quand même l'analyse
    return {
      success: true,
      analysis: analysisJson,
      generated_at: new Date().toISOString(),
    };

  } catch (err) {
    console.error("❌ Erreur analyse :", err);
    return { success: false, message: err.message };
  }
}
