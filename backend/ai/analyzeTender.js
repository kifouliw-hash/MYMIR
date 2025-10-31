// backend/ai/analyzeTender.js

import fs from "fs";
import OpenAI from "openai";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

const openai = new OpenAI({ apiKey: process.env.***REMOVED*** });

/**
 * Extraction de texte depuis un PDF via pdfjs-dist
 * Compatible Render / Node 20 (pas de DOM, pas de Canvas)
 */
async function extractTextFromPDF(filePath) {
  const data = new Uint8Array(fs.readFileSync(filePath));
  const pdf = await pdfjsLib.getDocument({ data }).promise;

  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(" ") + "\n";
  }
  return text;
}

/**
 * Analyse complète d'un document d'appel d'offres pour MyMír.
 * @param {string} filePath - Chemin du fichier PDF/DOCX temporaire
 * @returns {object} Résultat complet d'analyse IA
 */
export async function analyzeTender(filePath) {
  try {
    console.log("📄 Lecture du PDF...");
    const extractedText = await extractTextFromPDF(filePath);
    console.log("✅ Texte extrait, envoi à l'IA...");

    // === 2️⃣ Prompt professionnel MyMír ===
    const prompt = `
Tu es **MyMír**, une IA d'analyse stratégique d'appels d'offres publics et privés.
Ta mission est d’aider les TPE, PME et bureaux d’études à comprendre rapidement les opportunités et les risques d’un marché.

Analyse le document suivant et produis une synthèse structurée en 7 sections.

---
### 1️⃣ Identification du marché
- Type de procédure (appel d’offres, consultation, MAPA, etc.)
- Acheteur / organisme émetteur
- Objet principal du marché
- Secteur d’activité concerné
- Référence ou numéro de consultation (si identifiable)

### 2️⃣ Données administratives clés
- Montant estimé ou budget (s’il est mentionné)
- Lieu d’exécution
- Durée ou nombre de lots
- Date limite de remise des offres
- Mode de dépôt (plateforme, papier, etc.)

### 3️⃣ Documents exigés
Liste les documents administratifs et techniques demandés (ex: DC1, DC2, mémoire technique, références, attestations fiscales, etc.)

### 4️⃣ Critères d’évaluation
- Pondération prix / technique / délais
- Points d’attention (éléments rédhibitoires, exigences spécifiques)
- Mots-clés qui indiquent les priorités du client

### 5️⃣ Analyse des risques
Évalue les risques suivants :
- **Conformité administrative** (risque de rejet)
- **Capacité technique** (complexité, exigences fortes)
- **Compétitivité** (niveau de concurrence attendu)
Donne un score de risque global sur 100 (0 = sans risque, 100 = très risqué).

### 6️⃣ Faisabilité pour une PME
Estime la faisabilité pour une PME ou artisan :
- Facile / Modéré / Difficile
- Justifie ton estimation en 2 à 3 lignes.

### 7️⃣ Score d’opportunité
Calcule un score global (0 à 100) basé sur :
- adéquation avec une PME standard,
- accessibilité des critères,
- rapport risque / potentiel.
Et conclus par une **recommandation synthétique** :
> Exemple : "Opportunité intéressante à envisager" ou "Marché trop contraignant pour une PME locale".

---
🧾 **Texte extrait pour analyse :**
${extractedText.slice(0, 15000)}
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
