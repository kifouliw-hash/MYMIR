// backend/ai/analyzeTender.js
import fs from "fs";
import OpenAI from "openai";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js"; // ✅ Version stable Node-compatible

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
// 🧠 Analyse IA MyMír
// ===============================================
export async function analyzeTender(filePath) {
  try {
    console.log("📄 Lecture du PDF :", filePath);
    const extractedText = await extractTextFromPDF(filePath);
    console.log("✅ Texte extrait :", extractedText.length, "caractères");

    const prompt = `
Tu es **MyMír**, une IA experte en analyse d’appels d’offres publics et privés.
Analyse le texte suivant et fournis une synthèse structurée :

1️⃣ Identification du marché
2️⃣ Données administratives clés
3️⃣ Documents exigés
4️⃣ Critères d’évaluation
5️⃣ Analyse des risques
6️⃣ Faisabilité pour une PME
7️⃣ Score d’opportunité et recommandation

Texte extrait :
${extractedText.slice(0, 15000)}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: "Tu es une IA experte en marchés publics. Sois claire et concise." },
        { role: "user", content: prompt },
      ],
    });

    const analysis = completion.choices?.[0]?.message?.content || "Aucune analyse générée.";
    fs.unlinkSync(filePath);
    console.log("✅ Analyse générée avec succès.");

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