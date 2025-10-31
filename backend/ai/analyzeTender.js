import fs from "fs";
import OpenAI from "openai";

// ✅ import "legacy" pour compatibilité Render (pas de DOM)
let pdfParse;
try {
  const mod = await import("pdf-parse/lib/pdf-parse.js");
  pdfParse = mod.default || mod;
  console.log("✅ pdf-parse chargé en mode legacy (Render compatible)");
} catch (err) {
  console.error("❌ Erreur import pdf-parse:", err);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Analyse complète d'un document d'appel d'offres pour MyMír.
 * @param {string} filePath - Chemin du fichier PDF/DOCX temporaire
 * @returns {object} Résultat complet d'analyse IA
 */
export async function analyzeTender(filePath) {
  try {
    // === 1️⃣ Lecture du fichier PDF ===
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const extractedText = data.text.slice(0, 15000); // limite de sécurité

    // === 2️⃣ Prompt professionnel MyMír ===
    const prompt = `
Tu es **MyMír**, une IA d'analyse stratégique d'appels d'offres publics et privés.
Ta mission est d’aider les TPE, PME et bureaux d’études à comprendre rapidement les opportunités et les risques d’un marché.

Analyse le document suivant et produis une synthèse structurée en 7 sections.

1️⃣ Identification du marché
2️⃣ Données administratives clés
3️⃣ Documents exigés
4️⃣ Critères d’évaluation
5️⃣ Analyse des risques
6️⃣ Faisabilité pour une PME
7️⃣ Score d’opportunité et recommandation finale

🧾 Texte extrait :
${extractedText}
`;

    // === 3️⃣ Appel OpenAI ===
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "Tu es une IA experte en marchés publics et en analyse de DCE. Fournis des analyses fiables, claires et structurées.",
        },
        { role: "user", content: prompt },
      ],
    });

    const analysis = completion.choices[0].message.content;

    // === 4️⃣ Nettoyage du fichier après traitement ===
    fs.unlinkSync(filePath);

    // === 5️⃣ Résultat renvoyé au front ===
    return {
      success: true,
      analysis,
      generated_at: new Date().toISOString(),
      model: "gpt-4o-mini",
    };
  } catch (err) {
    console.error("❌ Erreur IA :", err);
    return {
      success: false,
      message:
        "Erreur pendant l'analyse du document. Vérifie la clé OpenAI ou le format du fichier.",
    };
  }
}
