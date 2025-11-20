// backend/ai/analyzeTender.js
import fs from "fs";
import OpenAI from "openai";
import mammoth from "mammoth";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import jwt from "jsonwebtoken";
import pool from "../../db.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ========== FONCTIONS D'EXTRACTION (NE PAS TOUCHER) ==========
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

async function extractTextFromDOCX(filePath) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

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
// ========== FIN FONCTIONS D'EXTRACTION ==========

export async function analyzeTender(filePath, token) {
  try {
    const extractedText = await extractText(filePath);
    const docLength = extractedText.length;

    // Charger profil utilisateur
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
        const { rows } = await pool.query("SELECT metadata FROM users WHERE id = $1", [userId]);
        if (rows.length > 0 && rows[0].metadata) {
          profilEntreprise = { ...profilEntreprise, ...rows[0].metadata };
        }
      } catch (err) {
        console.warn("⚠️ Profil non chargé");
      }
    }

    console.log(`📄 Document: ${docLength} caractères`);
    console.log("🧩 Profil:", profilEntreprise);

    const prompt = `Tu es MyMír, expert en analyse d'appels d'offres SPÉCIALISÉ dans l'accompagnement des PME, TPE et startups françaises.

🎯 MISSION : Transformer une analyse d'appel d'offres en PLAN D'ACTION CONCRET et RÉALISTE pour une petite structure.

👤 PROFIL ENTREPRISE
${JSON.stringify(profilEntreprise, null, 2)}

📄 DOCUMENT (${docLength} car.)
${extractedText.slice(0, 30000)}

⚠️ RÈGLES SCORING STRICTES
- **Incompatibilité sectorielle = score MAX 15/100**
- **CA < 10% montant marché = score MAX 30/100**
- **Absence certification obligatoire = -25 points**
- **Localisation > 200km = -15 points**

🔍 ANALYSE OBLIGATOIRE

═══════════════════════════════════════════
1️⃣ IDENTIFICATION MARCHÉ
═══════════════════════════════════════════
✓ Titre exact
✓ Type marché (Public/Privé)
✓ Secteur précis
✓ Sous-secteur
✓ Autorité contractante
✓ Lieu exécution
✓ Montant estimé
✓ Date limite dépôt
✓ Date démarrage
✓ Durée marché
✓ Référence AO
✓ Plateforme/portail

═══════════════════════════════════════════
2️⃣ DÉTECTION INCOMPATIBILITÉ CRITIQUE
═══════════════════════════════════════════
**AVANT TOUT** : Compare secteur entreprise vs secteur marché

Si **INCOMPATIBILITÉ SECTORIELLE TOTALE** :
- Secteur entreprise : [secteur profil]
- Secteur marché : [secteur AO]
- Verdict : INCOMPATIBLE
- ⚠️ Score forcé : 5-15/100

═══════════════════════════════════════════
3️⃣ CONTEXTE & OBJECTIFS
═══════════════════════════════════════════
Synthèse 3-4 phrases

═══════════════════════════════════════════
4️⃣ CRITÈRES D'ATTRIBUTION
═══════════════════════════════════════════
Liste avec pondérations

═══════════════════════════════════════════
5️⃣ EXIGENCES & DOCUMENTS
═══════════════════════════════════════════
Documents admin, techniques, certifications, références

═══════════════════════════════════════════
6️⃣ ANALYSE PROFIL ENTREPRISE
═══════════════════════════════════════════
Points forts, points faibles, ressources, compatibilités

═══════════════════════════════════════════
7️⃣ ANALYSE CONCURRENCE
═══════════════════════════════════════════
Niveau, profils concurrents, barrières, avantages

═══════════════════════════════════════════
8️⃣ RISQUES JURIDIQUES & FINANCIERS
═══════════════════════════════════════════
Pénalités, garanties, assurances, délais

═══════════════════════════════════════════
9️⃣ SCORE & OPPORTUNITÉ
═══════════════════════════════════════════
**Calcul score /100** :
- Correspondance sectorielle (30 pts) - BLOQUANT si incompatible
- Capacité technique (25 pts)
- Capacité financière (20 pts)
- Localisation (10 pts)
- Timing (10 pts)
- Certifications (5 pts)

**Barème** :
- 0-20 : ❌❌ INCOMPATIBLE
- 21-39 : ❌ Non recommandé
- 40-54 : ⚠️ Risqué
- 55-69 : ⚠️ Faisable
- 70-79 : ✅ Bonne opportunité
- 80-89 : ✅✅ Très compatible
- 90-100 : 🎯 Parfait

═══════════════════════════════════════════
🔟 RECOMMANDATIONS
═══════════════════════════════════════════
Renforcer, améliorer, valoriser, éviter

═══════════════════════════════════════════
1️⃣1️⃣ 🎯 STRATÉGIE CANDIDATURE (si score < 60)
═══════════════════════════════════════════
**Opportunités à valoriser** : [liste]
**Stratégie recommandée** :
✅ À FAIRE : [actions]
❌ À NE PAS FAIRE : [pièges]
⚠️ Conditions préalables : [requis]

**Feuille de route** :
- Court terme (0-3 mois) : [actions]
- Moyen terme (3-12 mois) : [développements]
- Long terme (12+ mois) : [positionnement]

═══════════════════════════════════════════
1️⃣2️⃣ 📋 PRÉPARATION DOSSIER
═══════════════════════════════════════════
**Complexité** : Simple/Moyenne/Élevée
**Temps préparation estimé** :
- Documents admin : X jours
- Mémoire technique : X jours
- Chiffrage : X jours
- TOTAL : X jours

**Coûts préparation** :
- Certifications : montant ou N/A
- Assurances : montant ou N/A
- Conseils : montant ou N/A
- TOTAL : montant

**Documents prioritaires** : [liste + conseils obtention]

═══════════════════════════════════════════
1️⃣3️⃣ 📅 CALENDRIER
═══════════════════════════════════════════
Rétro-planning depuis date limite

═══════════════════════════════════════════
1️⃣4️⃣ 🆘 AIDES & ACCOMPAGNEMENTS
═══════════════════════════════════════════
Organismes (CCI, BPI), plateformes, conseils

═══════════════════════════════════════════
1️⃣5️⃣ PLAN DÉPÔT
═══════════════════════════════════════════
Étapes séquentielles

═══════════════════════════════════════════
1️⃣6️⃣ CHECKLIST FINALE
═══════════════════════════════════════════
Points de vérification

═══════════════════════════════════════════
1️⃣7️⃣ ALERTES
═══════════════════════════════════════════
Signaux d'alerte

═══════════════════════════════════════════

🎯 FORMAT RÉPONSE : JSON UNIQUEMENT

{
  "title": "Titre",
  "type_marche": "Type",
  "secteur": "Secteur",
  "sous_secteur": "Sous-secteur",
  "autorite": "Autorité",
  "lieu": "Lieu",
  "date_limite": "JJ/MM/AAAA",
  "montant_estime": "Montant",
  "duree": "Durée",
  "reference": "Ref",
  "plateforme": "Plateforme",
  "incompatibilite_critique": {
    "detectee": false,
    "secteur_entreprise": "",
    "secteur_marche": "",
    "justification": ""
  },
  "contexte": "Contexte",
  "criteres_attribution": [{"nom": "Prix", "ponderation": "60%"}],
  "documents_requis": [],
  "certifications_requises": [],
  "references_clients_requises": "",
  "garanties_financieres": "",
  "analyse_profil": {
    "points_forts": [],
    "points_faibles": [],
    "ressources_a_mobiliser": [],
    "compatibilite": {
      "geographique": "",
      "technique": "",
      "financiere": "",
      "temporelle": ""
    }
  },
  "analyse_concurrence": {
    "niveau": "",
    "profils_concurrents": "",
    "barrieres_entree": [],
    "avantages_differenciation": []
  },
  "risques_juridiques_financiers": {
    "clauses_penalites": "",
    "garantie_decennale": "",
    "assurance_responsabilite": "",
    "delais_paiement": "",
    "avance_versee": "",
    "risque_contentieux": ""
  },
  "score": 50,
  "opportunity": "",
  "justification_score": "",
  "recommendations": {
    "renforcer_dossier": "",
    "ameliorer_profil": "",
    "points_a_valoriser": "",
    "erreurs_a_eviter": ""
  },
  "strategie_candidature": {
    "opportunites_a_valoriser": [],
    "actions_recommandees": {
      "a_faire": [],
      "a_ne_pas_faire": [],
      "conditions_prealables": []
    },
    "feuille_de_route": {
      "court_terme": [],
      "moyen_terme": [],
      "long_terme": []
    }
  },
  "preparation_dossier": {
    "complexite": "",
    "temps_preparation": {
      "documents_admin": "",
      "memoire_technique": "",
      "chiffrage": "",
      "total": ""
    },
    "couts_preparation": {
      "certifications": "",
      "assurances": "",
      "conseils_externes": "",
      "total": ""
    },
    "documents_prioritaires": []
  },
  "calendrier": {
    "date_limite": "",
    "deadline_interne_recommandee": "",
    "temps_disponible_jours": 0,
    "appreciation_delai": "",
    "retro_planning": []
  },
  "aides_accompagnements": {
    "organismes_utiles": [],
    "plateformes": [],
    "besoin_conseil_externe": ""
  },
  "plan_de_depot": [],
  "checklist": [],
  "alertes": []
}

⚡ JSON uniquement, pas de markdown.`;

    console.log("🤖 Envoi OpenAI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        { 
          role: "system", 
          content: "Tu es MyMír, expert accompagnement PME/TPE marchés publics. Analyses pragmatiques et ACTIONNABLES. JSON uniquement." 
        },
        { role: "user", content: prompt }
      ],
    });

    let analysisText = completion.choices?.[0]?.message?.content || "{}";
    
    analysisText = analysisText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .replace(/^[^{]*/, "")
      .replace(/[^}]*$/, "")
      .trim();

    console.log("📝 JSON reçu:", analysisText.slice(0, 200));

    let analysisJson = JSON.parse(analysisText);
    
    // Normalisation
    analysisJson.title = analysisJson.title || "Analyse effectuée";
    analysisJson.score = Math.max(0, Math.min(100, parseInt(analysisJson.score) || 50));
    
    if (analysisJson.incompatibilite_critique?.detectee) {
      analysisJson.score = Math.min(analysisJson.score, 15);
      analysisJson.opportunity = "INCOMPATIBLE";
    }
    
    analysisJson.type_marche = analysisJson.type_marche || "Non précisé";
    analysisJson.contexte = analysisJson.contexte || "Analyse terminée";
    analysisJson.documents_requis = analysisJson.documents_requis || [];
    analysisJson.criteres_attribution = analysisJson.criteres_attribution || [];
    
    // Valeurs par défaut
    if (!analysisJson.analyse_profil) {
      analysisJson.analyse_profil = {
        points_forts: [],
        points_faibles: [],
        ressources_a_mobiliser: [],
        compatibilite: { geographique: "N/A", technique: "N/A", financiere: "N/A", temporelle: "N/A" }
      };
    }
    
    if (!analysisJson.analyse_concurrence) {
      analysisJson.analyse_concurrence = {
        niveau: "Non évalué",
        profils_concurrents: "N/A",
        barrieres_entree: [],
        avantages_differenciation: []
      };
    }
    
    if (!analysisJson.risques_juridiques_financiers) {
      analysisJson.risques_juridiques_financiers = {
        clauses_penalites: "N/A",
        garantie_decennale: "N/A",
        assurance_responsabilite: "N/A",
        delais_paiement: "N/A",
        avance_versee: "N/A",
        risque_contentieux: "N/A"
      };
    }
    
    if (!analysisJson.strategie_candidature) {
      analysisJson.strategie_candidature = {
        opportunites_a_valoriser: [],
        actions_recommandees: { a_faire: [], a_ne_pas_faire: [], conditions_prealables: [] },
        feuille_de_route: { court_terme: [], moyen_terme: [], long_terme: [] }
      };
    }
    
    if (!analysisJson.preparation_dossier) {
      analysisJson.preparation_dossier = {
        complexite: "Non évaluée",
        temps_preparation: { documents_admin: "N/A", memoire_technique: "N/A", chiffrage: "N/A", total: "N/A" },
        couts_preparation: { certifications: "N/A", assurances: "N/A", conseils_externes: "N/A", total: "N/A" },
        documents_prioritaires: []
      };
    }
    
    if (!analysisJson.calendrier) {
      analysisJson.calendrier = {
        date_limite: "N/A",
        deadline_interne_recommandee: "N/A",
        temps_disponible_jours: 0,
        appreciation_delai: "Non évalué",
        retro_planning: []
      };
    }
    
    if (!analysisJson.aides_accompagnements) {
      analysisJson.aides_accompagnements = {
        organismes_utiles: [],
        plateformes: [],
        besoin_conseil_externe: "Non évalué"
      };
    }
    
    console.log("✅ Score:", analysisJson.score);

    try { fs.unlinkSync(filePath); } catch {}

    if (userId) {
      try {
        const { rows } = await pool.query(
          `INSERT INTO analyses (user_id, title, score, summary, analysis, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
          [userId, analysisJson.title, analysisJson.score, analysisJson.contexte, JSON.stringify(analysisJson)]
        );
        console.log(`💾 Sauvegardé ID: ${rows[0].id}`);
        return {
          success: true,
          _id: rows[0].id,
          analysis: analysisJson,
          profilEntreprise,
          generated_at: new Date().toISOString(),
        };
      } catch (dbErr) {
        console.error("❌ DB:", dbErr.message);
      }
    }

    return {
      success: true,
      analysis: analysisJson,
      profilEntreprise,
      generated_at: new Date().toISOString(),
    };

  } catch (err) {
    console.error("❌ Erreur:", err);
    return { 
      success: false, 
      message: err.message,
      analysis: { title: "Erreur", score: 0, contexte: err.message }
    };
  }
}
