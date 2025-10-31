// backend/ai/analyzeTender.js

import fs from "fs";
import OpenAI from "openai";
import * as pdfjs from "pdfjs-dist"; // ✅ Import Node-compatible
import { getDocument } from "pdfjs-dist/build/pdf.mjs"; // ✅ Forçage ES module

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================
// 🔍 Extraction du texte depuis un PDF
// ============================================
async function extractTextFromPDF(filePath) {
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
    const pdf = await getDocument({ data }).promise;
    let text = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item) => item.str).join(" ") + "\n";
    }

    if (text.trim().length === 0) throw new Error("PDF vide ou illisible.");
    return text;
  } catch (err) {
    console.error("❌ Erreur d’extraction PDF :", err);
    throw new Error("Impossible de lire le fichier PDF.");
  }
}

// ============================================
// 🧠 Analyse IA MyMír
// ============================================
export async function analyzeTender(filePath) {
  try {
    console.log("📄 Lecture du PDF :", filePath);
    const extractedText = await extractTextFromPDF(filePath);

    console.log("✅ Texte extrait — longueur :", extractedText.length);

    const prompt = `
Tu es **MyMír**, une IA d'analyse stratégique d'appels d'offres publics et privés.
Analyse le texte suivant et produis une synthèse claire et complète structurée en 7 sections :
1️⃣ Identification du marché
2️⃣ Données administratives clés
3️⃣ Documents exigés
4️⃣ Critères d’évaluation
5️⃣ Analyse des risques
6️⃣ Faisabilité pour une PME
7️⃣ Score d’opportunité et recommandation

🧾 **Extrait du document :**
${extractedText.slice(0, 15000)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "Tu es une IA experte en analyse de marchés publics et DCE. Sois claire, concise et précise.",
        },
        { role: "user", content: prompt },
      ],
    });

    const analysis = completion.choices?.[0]?.message?.content || "Analyse vide.";

    fs.unlinkSync(filePath);

    console.log("✅ Analyse générée avec succès.");
    return {
      success: true,
      analysis,
      generated_at: new Date().toISOString(),
      model: "gpt-4o-mini",
    };
  } catch (err) {
    console.error("❌ Erreur complète analyzeTender :", err);
    return {
      success: false,
      message:
        "Erreur pendant l'analyse du document : " +
        (err.message || "Erreur inconnue."),
    };
  }
}