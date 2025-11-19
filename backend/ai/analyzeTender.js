// backend/ai/analyzeTender.js
import fs from "fs";
import OpenAI from "openai";
import mammoth from "mammoth";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import jwt from "jsonwebtoken";
import pool from "../../db.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Extraction PDF
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

// Extraction DOCX
async function extractTextFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

// Extraction générique
async function extractText(filePath) {
  const ext = filePath.toLowerCase();
  if (ext.endsWith('.pdf')) {
    return await extractTextFromPDF(filePath);
  } else if (ext.endsWith('.docx') || ext.endsWith('.doc')) {
    return await extractTextFromDOCX(filePath);
  } else {
    throw new Error("Format non supporté. Utilisez PDF ou DOCX.");
  }
}

export async function analyzeTender(filePath, token) {
  try {
    const extractedText = await extractText(filePath);
    const docLength = extractedText.length;

    // Charger le profil réel utilisateur
    let profilEntreprise = {
      companyName: "Non renseigné",
      sector: "Non précisé",
      revenue: "Non précisé",
      effectif: "Non précisé",
      country: "France",
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

        if (rows.length > 0 && rows[0].metadata) {
          profilEntreprise = { ...profilEntreprise, ...rows[0].metadata };
        }
      } catch (err) {
        console.warn("⚠️ Profil non chargé");
      }
    }

    console.log(`📄 Document: ${docLength} caractères`);
    console.log("🧩 Profil utilisé:", profilEntreprise);

    // PROMPT ULTRA-ROBUSTE ET ADAPTATIF
    const prompt = `Tu es MyMír, expert en analyse stratégique d'appels d'offres pour PME, ETI et startups françaises.

🎯 CONTEXTE DE LA MISSION
Une entreprise souhaite évaluer rapidement et précisément si elle doit candidater à un appel d'offres.
Tu dois analyser le document fourni avec rigueur, pragmatisme et honnêteté intellectuelle.

👤 PROFIL DE L'ENTREPRISE CANDIDATE
${JSON.stringify(profilEntreprise, null, 2)}

📊 DOCUMENT À ANALYSER (${docLength} caractères)
${extractedText.slice(0, 30000)}

⚠️ RÈGLES FONDAMENTALES
1. **Adaptabilité** : Le document peut être complet (20+ pages) ou minimal (1 page). Adapte ton niveau de détail.
2. **Honnêteté** : Si une info n'existe PAS dans le document, indique "N/A" ou "Non précisé". N'invente RIEN.
3. **Pragmatisme** : Analyse selon le profil réel fourni, pas un profil idéal.
4. **Réalisme** : Un score de 50-60 est normal. Ne surestime pas, ne sous-estime pas.
5. **Clarté** : Sois concis et actionnable. Pas de jargon inutile.

🔍 ANALYSE OBLIGATOIRE

═══════════════════════════════════════════
1️⃣ IDENTIFICATION DU MARCHÉ
═══════════════════════════════════════════

Extrais PRÉCISÉMENT (si disponible) :
✓ Titre exact de l'appel d'offres
✓ Type de marché : Public/Privé + secteur (IT, BTP, Conseil, Fournitures, Services, Santé, etc.)
✓ Sous-secteur ou domaine spécifique
✓ Autorité contractante : nom exact, ville, type (Mairie, Ministère, Entreprise privée, etc.)
✓ Lieu d'exécution : ville(s), région(s), national/international
✓ Montant estimé ou fourchette budgétaire
✓ Date limite de dépôt des offres (format exact)
✓ Date de démarrage prévue
✓ Durée du marché
✓ Référence de l'appel d'offres
✓ Modalités de consultation : plateforme, portail, contact

═══════════════════════════════════════════
2️⃣ CONTEXTE ET OBJECTIFS
═══════════════════════════════════════════

Synthétise en 3-4 phrases maximum :
✓ Pourquoi cet appel d'offres existe (contexte, problème à résoudre)
✓ Objectifs principaux du projet
✓ Enjeux stratégiques pour l'acheteur
✓ Particularités ou contraintes majeures

═══════════════════════════════════════════
3️⃣ EXIGENCES ET DOCUMENTS
═══════════════════════════════════════════

Liste EXHAUSTIVE de :
✓ Documents administratifs obligatoires (DC1, DC2, KBIS, attestations fiscales/sociales, assurances, bilans, etc.)
✓ Documents techniques requis (mémoire technique, méthodologie, planning, CV, etc.)
✓ Certifications/qualifications exigées (ISO, Qualibat, RGE, Qualiopi, etc.)
✓ Références clients similaires demandées (nombre, type, date)
✓ Garanties financières ou cautions
✓ Conditions d'éligibilité (CA minimum, effectif, ancienneté, etc.)

═══════════════════════════════════════════
4️⃣ ANALYSE PROFIL ENTREPRISE
═══════════════════════════════════════════

Compare OBJECTIVEMENT le profil fourni avec les exigences :

**Points forts** (2-4 éléments) :
- Compétences/expertises qui matchent parfaitement
- Atouts spécifiques pour CE marché
- Avantages concurrentiels

**Points faibles** (2-4 éléments) :
- Manques ou lacunes identifiés
- Risques potentiels
- Contraintes à gérer

**Ressources à mobiliser** :
- Humaines (profils, nombre)
- Techniques (équipements, outils)
- Financières (trésorerie, caution)
- Partenariats éventuels

**Compatibilité détaillée** :
- **Géographique** : Compatible / Moyen / Incompatible + explication (distance, implantation, etc.)
- **Technique** : Compatible / Moyen / Incompatible + explication (compétences, équipements, etc.)
- **Financière** : Compatible / Moyen / Incompatible + explication (CA vs montant, trésorerie, caution, etc.)
- **Temporelle** : Compatible / Moyen / Incompatible + explication (disponibilité, délai, etc.)

═══════════════════════════════════════════
5️⃣ SCORE ET OPPORTUNITÉ
═══════════════════════════════════════════

**Score de compatibilité sur 100** basé sur :
- Correspondance sectorielle (25 points)
- Capacité technique (25 points)
- Capacité financière (20 points)
- Localisation (15 points)
- Timing et disponibilité (15 points)

**Barème d'interprétation** :
- 0-39 : ❌ Non recommandé - Trop de risques ou incompatibilités majeures
- 40-59 : ⚠️ Faisable mais demande gros efforts - Nécessite renforcements importants
- 60-74 : ✅ Bonne opportunité - Préparation sérieuse requise
- 75-89 : ✅✅ Très compatible - Recommandé de candidater
- 90-100 : 🎯 Parfaitement aligné - Candidature prioritaire

**Niveau d'opportunité** :
Choisis parmi : "Excellente opportunité" / "Bonne opportunité" / "Opportunité moyenne" / "Faisable avec ajustements" / "Risqué" / "Non recommandé"

**Justification du score** (2-3 phrases) :
Explique CLAIREMENT pourquoi ce score, en citant les facteurs clés.

═══════════════════════════════════════════
6️⃣ RECOMMANDATIONS STRATÉGIQUES
═══════════════════════════════════════════

**Pour renforcer le dossier** :
Conseils concrets et actionnables (priorité 1)

**Pour améliorer le profil** :
Actions à moyen terme pour mieux se positionner

**Points à valoriser** :
Atouts à mettre en avant dans la candidature

**Erreurs à éviter absolument** :
Pièges classiques et erreurs rédhibitoires

═══════════════════════════════════════════
7️⃣ PLAN DE DÉPÔT
═══════════════════════════════════════════

Liste séquentielle des étapes :
1. Action 1
2. Action 2
3. Action 3
etc.

Include : recherche docs, rédaction, relecture, soumission, plateforme à utiliser

═══════════════════════════════════════════
8️⃣ CHECKLIST FINALE
═══════════════════════════════════════════

Liste de vérification avant soumission (5-8 points) :
☐ Point 1
☐ Point 2
etc.

═══════════════════════════════════════════
9️⃣ ALERTES ET RISQUES
═══════════════════════════════════════════

Identifie les signaux d'alerte s'ils existent :
- Délais très courts
- Exigences disproportionnées
- Cautions importantes
- Clauses pénalisantes
- Concurrence intense attendue

═══════════════════════════════════════════

🎯 FORMAT DE RÉPONSE

RÉPONDS **UNIQUEMENT** EN JSON VALIDE, SANS MARKDOWN, SANS TEXTE AVANT/APRÈS :

{
  "title": "Titre exact du marché",
  "type_marche": "Type précis (ex: Marché public de services informatiques)",
  "secteur": "Secteur (IT, BTP, Conseil, etc.)",
  "autorite": "Nom exact de l'autorité contractante",
  "lieu": "Ville(s) ou région(s)",
  "date_limite": "Date format JJ/MM/AAAA ou N/A",
  "montant_estime": "Budget ou N/A",
  "duree": "Durée du marché ou N/A",
  "reference": "Référence AO ou N/A",
  "contexte": "Synthèse 3-4 phrases",
  "documents_requis": ["Doc 1", "Doc 2", "etc."],
  "certifications_requises": ["Cert 1", "Cert 2"] ou [],
  "references_clients_requises": "Description ou N/A",
  "analyse_profil": {
    "points_forts": ["Point 1", "Point 2", "Point 3"],
    "points_faibles": ["Point 1", "Point 2"],
    "ressources_a_mobiliser": ["Ressource 1", "Ressource 2"],
    "compatibilite": {
      "geographique": "Compatible/Moyen/Incompatible - explication",
      "technique": "Compatible/Moyen/Incompatible - explication",
      "financiere": "Compatible/Moyen/Incompatible - explication",
      "temporelle": "Compatible/Moyen/Incompatible - explication"
    }
  },
  "score": 65,
  "opportunity": "Bonne opportunité",
  "justification_score": "Explication claire du score",
  "recommendations": {
    "renforcer_dossier": "Conseil principal",
    "ameliorer_profil": "Conseil amélioration",
    "points_a_valoriser": "Points à mettre en avant",
    "erreurs_a_eviter": "Erreurs à éviter"
  },
  "plan_de_depot": [
    "Étape 1",
    "Étape 2",
    "Étape 3"
  ],
  "checklist": [
    "Point vérif 1",
    "Point vérif 2",
    "Point vérif 3"
  ],
  "alertes": ["Alerte 1", "Alerte 2"] ou []
}

⚡ RAPPEL CRITIQUE : JSON uniquement, pas de markdown (\`\`\`), pas de texte explicatif.`;

    console.log("🤖 Envoi à OpenAI (gpt-4o)...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        { 
          role: "system", 
          content: "Tu es MyMír, expert en analyse d'appels d'offres. Tu produis des analyses pragmatiques, honnêtes et actionnables. Tu réponds UNIQUEMENT en JSON valide, sans markdown ni texte supplémentaire." 
        },
        { role: "user", content: prompt }
      ],
    });

    let analysisText = completion.choices?.[0]?.message?.content || "{}";
    
    // Nettoyage ultra-robuste
    analysisText = analysisText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/^[^{]*/, "")
      .replace(/[^}]*$/, "")
      .trim();

    console.log("📝 JSON reçu:", analysisText.slice(0, 300) + "...");

    let analysisJson;
    try {
      analysisJson = JSON.parse(analysisText);
      
      // Validation et normalisation
      analysisJson.title = analysisJson.title || "Document analysé";
      analysisJson.score = Math.max(0, Math.min(100, parseInt(analysisJson.score) || 50));
      analysisJson.type_marche = analysisJson.type_marche || "Non précisé";
      analysisJson.autorite = analysisJson.autorite || "N/A";
      analysisJson.date_limite = analysisJson.date_limite || "N/A";
      analysisJson.contexte = analysisJson.contexte || "Analyse effectuée";
      analysisJson.documents_requis = analysisJson.documents_requis || [];
      analysisJson.certifications_requises = analysisJson.certifications_requises || [];
      
      if (!analysisJson.analyse_profil || typeof analysisJson.analyse_profil !== 'object') {
        analysisJson.analyse_profil = {
          points_forts: [],
          points_faibles: [],
          ressources_a_mobiliser: [],
          compatibilite: {
            geographique: "À vérifier",
            technique: "À vérifier",
            financiere: "À vérifier",
            temporelle: "À vérifier"
          }
        };
      }
      
      console.log("✅ JSON validé");
      
    } catch (parseError) {
      console.error("❌ Erreur parsing:", parseError.message);
      
      // Fallback robuste
      analysisJson = {
        title: "Analyse partielle",
        type_marche: "Non déterminé",
        secteur: "Non déterminé",
        autorite: "N/A",
        lieu: "N/A",
        date_limite: "N/A",
        montant_estime: "N/A",
        contexte: "Le document a été partiellement analysé. Certaines informations n'ont pas pu être extraites automatiquement.",
        documents_requis: [],
        certifications_requises: [],
        analyse_profil: {
          points_forts: ["Analyse en cours"],
          points_faibles: ["Données incomplètes"],
          ressources_a_mobiliser: ["À déterminer"],
          compatibilite: {
            geographique: "À vérifier manuellement",
            technique: "À vérifier manuellement",
            financiere: "À vérifier manuellement",
            temporelle: "À vérifier manuellement"
          }
        },
        score: 50,
        opportunity: "Analyse à compléter",
        justification_score: "Score neutre - analyse incomplète",
        recommendations: {
          renforcer_dossier: "Relire le document source",
          ameliorer_profil: "Compléter les informations",
          points_a_valoriser: "À déterminer",
          erreurs_a_eviter: "Vérifier manuellement"
        },
        plan_de_depot: ["Relire document", "Vérifier exigences", "Préparer dossier"],
        checklist: ["Document lu", "Exigences identifiées", "Dossier préparé"],
        alertes: ["Extraction automatique partielle - Vérification manuelle recommandée"]
      };
    }

    // Suppression fichier temporaire
    try {
      fs.unlinkSync(filePath);
      console.log("🗑️ Fichier temporaire supprimé");
    } catch {}

    // Sauvegarde en base
    if (userId) {
      try {
        const { rows } = await pool.query(
          `INSERT INTO analyses (user_id, title, score, summary, analysis, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())
           RETURNING id`,
          [
            userId,
            analysisJson.title,
            analysisJson.score,
            analysisJson.contexte || "",
            JSON.stringify(analysisJson)
          ]
        );

        const savedId = rows[0].id;
        console.log(`💾 Analyse sauvegardée - ID: ${savedId}`);

        return {
          success: true,
          _id: savedId,
          analysis: analysisJson,
          profilEntreprise,
          generated_at: new Date().toISOString(),
        };

      } catch (dbErr) {
        console.error("❌ Erreur DB:", dbErr.message);
      }
    }

    return {
      success: true,
      analysis: analysisJson,
      profilEntreprise,
      generated_at: new Date().toISOString(),
    };

  } catch (err) {
    console.error("❌ Erreur globale:", err);
    return { 
      success: false, 
      message: err.message,
      analysis: {
        title: "Erreur d'analyse",
        score: 0,
        contexte: `Erreur technique: ${err.message}`
      }
    };
  }
}
