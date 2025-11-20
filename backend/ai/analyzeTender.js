// backend/ai/analyzeTender.js
// ... (garder imports et fonctions d'extraction identiques)

export async function analyzeTender(filePath, token) {
  try {
    const extractedText = await extractText(filePath);
    const docLength = extractedText.length;

    // Charger profil utilisateur (identique)
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
    console.log("🧩 Profil utilisé:", profilEntreprise);

    // ========== PROMPT AMÉLIORÉ ==========
    const prompt = `Tu es MyMír, expert en analyse stratégique d'appels d'offres pour PME françaises.

🎯 MISSION : Évaluer HONNÊTEMENT si l'entreprise doit candidater.

👤 PROFIL ENTREPRISE
${JSON.stringify(profilEntreprise, null, 2)}

📄 DOCUMENT (${docLength} car.)
${extractedText.slice(0, 30000)}

⚠️ RÈGLES SCORING STRICTES
- **Incompatibilité sectorielle = score MAX 15/100**
  Ex: Entreprise IT candidatant à marché BTP/terrassement/construction
- **Chiffre d'affaires < 10% du montant marché = score MAX 30/100**
- **Absence certification obligatoire = -25 points**
- **Localisation hors zone > 200km = -15 points**

🔍 ANALYSE OBLIGATOIRE

═══════════════════════════════════════════
1️⃣ IDENTIFICATION MARCHÉ
═══════════════════════════════════════════
✓ Titre exact
✓ Type marché (Public/Privé)
✓ Secteur précis (IT, BTP, Conseil, Fournitures, Services, Santé, Travaux, etc.)
✓ Sous-secteur détaillé
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

Si **INCOMPATIBILITÉ SECTORIELLE TOTALE** détectée :
- Secteur entreprise : [secteur profil]
- Secteur marché : [secteur AO]
- Verdict : INCOMPATIBLE
- Justification : [pourquoi]
- ⚠️ Score forcé : 5-15/100
- ⚠️ Recommendation : NE PAS CANDIDATER

Exemples incompatibilités :
- Informatique → Travaux BTP/Terrassement
- Commerce → Prestations médicales
- Restauration → Développement logiciel
- Services → Fabrication industrielle

═══════════════════════════════════════════
3️⃣ CONTEXTE & OBJECTIFS
═══════════════════════════════════════════
Synthèse 3-4 phrases : pourquoi cet AO, objectifs, enjeux

═══════════════════════════════════════════
4️⃣ CRITÈRES D'ATTRIBUTION
═══════════════════════════════════════════
Extrais précisément :
- Critère 1 : [nom] - Pondération [X%]
- Critère 2 : [nom] - Pondération [X%]
- Sous-critères éventuels
- Mode évaluation (notation, classement, etc.)

═══════════════════════════════════════════
5️⃣ EXIGENCES & DOCUMENTS
═══════════════════════════════════════════
**Documents administratifs** : [liste]
**Documents techniques** : [liste]
**Certifications obligatoires** : [liste]
**Références clients** : [nombre, type, période]
**Garanties financières** : [montants]
**Conditions éligibilité** : CA min, effectif, etc.

═══════════════════════════════════════════
6️⃣ ANALYSE PROFIL ENTREPRISE
═══════════════════════════════════════════
**Points forts** (2-4) : atouts réels pour CE marché
**Points faibles** (2-4) : manques identifiés
**Ressources mobiliser** : humaines, techniques, financières, partenariats

**Compatibilité détaillée** :
- **Géographique** : Compatible/Moyen/Incompatible + distance réelle
- **Technique** : Compatible/Moyen/Incompatible + compétences précises
- **Financière** : Compatible/Moyen/Incompatible + ratio CA/montant
- **Temporelle** : Compatible/Moyen/Incompatible + disponibilité

═══════════════════════════════════════════
7️⃣ ANALYSE CONCURRENCE
═══════════════════════════════════════════
- **Niveau concurrence estimé** : Faible/Moyen/Fort
- **Profils concurrents typiques** : [description]
- **Barrières entrée** : [liste obstacles]
- **Avantages différenciation possibles** : [liste]

═══════════════════════════════════════════
8️⃣ RISQUES JURIDIQUES & FINANCIERS
═══════════════════════════════════════════
- **Clauses pénalités** : [oui/non, montants]
- **Garantie décennale** : [requise oui/non]
- **Assurance responsabilité** : [montants min]
- **Délais paiement** : [30j, 60j, etc.]
- **Avance versée** : [oui/non, %]
- **Risque contentieux** : [Faible/Moyen/Élevé]

═══════════════════════════════════════════
9️⃣ SCORE & OPPORTUNITÉ
═══════════════════════════════════════════
**Calcul score /100** basé sur :
- Correspondance sectorielle (30 pts) - BLOQUANT si incompatible
- Capacité technique (25 pts)
- Capacité financière (20 pts)
- Localisation (10 pts)
- Timing (10 pts)
- Certifications (5 pts)

**Barème** :
- 0-20 : ❌❌ INCOMPATIBILITÉ MAJEURE - Ne pas candidater
- 21-39 : ❌ Non recommandé - Trop de risques
- 40-54 : ⚠️ Risqué - Gros efforts requis
- 55-69 : ⚠️ Faisable - Préparation sérieuse
- 70-79 : ✅ Bonne opportunité
- 80-89 : ✅✅ Très compatible
- 90-100 : 🎯 Parfait - Priorité absolue

**Niveau opportunité** : [Excellente/Bonne/Moyenne/Faisable/Risqué/Non recommandé/INCOMPATIBLE]

**Justification score** (2-3 phrases claires)

═══════════════════════════════════════════
🔟 RECOMMANDATIONS STRATÉGIQUES
═══════════════════════════════════════════
**Renforcer dossier** : [actions concrètes priorité 1]
**Améliorer profil** : [actions moyen terme]
**Points valoriser** : [atouts à mettre en avant]
**Erreurs éviter** : [pièges critiques]

═══════════════════════════════════════════
1️⃣1️⃣ PLAN DÉPÔT
═══════════════════════════════════════════
1. [Étape 1]
2. [Étape 2]
3. [Étape 3]
etc.

═══════════════════════════════════════════
1️⃣2️⃣ CHECKLIST FINALE
═══════════════════════════════════════════
☐ [Point 1]
☐ [Point 2]
etc.

═══════════════════════════════════════════
1️⃣3️⃣ ALERTES & SIGNAUX
═══════════════════════════════════════════
[Liste alertes identifiées ou []]

═══════════════════════════════════════════

🎯 FORMAT RÉPONSE : JSON UNIQUEMENT, PAS DE MARKDOWN

{
  "title": "Titre exact",
  "type_marche": "Type précis",
  "secteur": "Secteur principal",
  "sous_secteur": "Sous-secteur détaillé",
  "autorite": "Nom autorité",
  "lieu": "Ville/région",
  "date_limite": "JJ/MM/AAAA",
  "montant_estime": "Budget ou N/A",
  "duree": "Durée ou N/A",
  "reference": "Ref AO",
  "plateforme": "Portail dépôt",
  
  "incompatibilite_critique": {
    "detectee": true/false,
    "secteur_entreprise": "Secteur profil",
    "secteur_marche": "Secteur AO",
    "justification": "Pourquoi incompatible"
  },
  
  "contexte": "Synthèse 3-4 phrases",
  
  "criteres_attribution": [
    {"nom": "Prix", "ponderation": "60%"},
    {"nom": "Technique", "ponderation": "40%"}
  ],
  
  "documents_requis": ["Doc1", "Doc2"],
  "certifications_requises": ["Cert1"] ou [],
  "references_clients_requises": "Description",
  "garanties_financieres": "Montants ou N/A",
  
  "analyse_profil": {
    "points_forts": ["Point1", "Point2"],
    "points_faibles": ["Point1", "Point2"],
    "ressources_a_mobiliser": ["Ress1", "Ress2"],
    "compatibilite": {
      "geographique": "Compatible/Moyen/Incompatible - détail",
      "technique": "Compatible/Moyen/Incompatible - détail",
      "financiere": "Compatible/Moyen/Incompatible - détail",
      "temporelle": "Compatible/Moyen/Incompatible - détail"
    }
  },
  
  "analyse_concurrence": {
    "niveau": "Faible/Moyen/Fort",
    "profils_concurrents": "Description",
    "barrieres_entree": ["Barrière1", "Barrière2"],
    "avantages_differenciation": ["Avantage1"]
  },
  
  "risques_juridiques_financiers": {
    "clauses_penalites": "Détail ou N/A",
    "garantie_decennale": "Oui/Non",
    "assurance_responsabilite": "Montant min ou N/A",
    "delais_paiement": "Jours",
    "avance_versee": "Oui/Non %",
    "risque_contentieux": "Faible/Moyen/Élevé"
  },
  
  "score": 12,
  "opportunity": "INCOMPATIBLE" ou autre niveau,
  "justification_score": "Explication claire",
  
  "recommendations": {
    "renforcer_dossier": "Conseil",
    "ameliorer_profil": "Conseil",
    "points_a_valoriser": "Points",
    "erreurs_a_eviter": "Erreurs"
  },
  
  "plan_de_depot": ["Étape1", "Étape2"],
  "checklist": ["Point1", "Point2"],
  "alertes": ["Alerte1"] ou []
}

⚡ JSON uniquement, pas de markdown, pas de texte.`;

    console.log("🤖 Envoi à OpenAI (gpt-4o)...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        { 
          role: "system", 
          content: "Tu es MyMír, expert en analyse d'appels d'offres. Tu es HONNÊTE et PRAGMATIQUE. Tu détectes les incompatibilités sectorielles. Tu réponds UNIQUEMENT en JSON valide." 
        },
        { role: "user", content: prompt }
      ],
    });

    let analysisText = completion.choices?.[0]?.message?.content || "{}";
    
    // Nettoyage
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
      
      // Validation
      analysisJson.title = analysisJson.title || "Document analysé";
      analysisJson.score = Math.max(0, Math.min(100, parseInt(analysisJson.score) || 50));
      
      // Si incompatibilité détectée, forcer score bas
      if (analysisJson.incompatibilite_critique?.detectee) {
        analysisJson.score = Math.min(analysisJson.score, 15);
        analysisJson.opportunity = "INCOMPATIBLE - Ne pas candidater";
      }
      
      // Normalisation champs
      analysisJson.type_marche = analysisJson.type_marche || "Non précisé";
      analysisJson.autorite = analysisJson.autorite || "N/A";
      analysisJson.date_limite = analysisJson.date_limite || "N/A";
      analysisJson.contexte = analysisJson.contexte || "Analyse effectuée";
      analysisJson.documents_requis = analysisJson.documents_requis || [];
      analysisJson.certifications_requises = analysisJson.certifications_requises || [];
      analysisJson.criteres_attribution = analysisJson.criteres_attribution || [];
      
      // Analyse profil par défaut
      if (!analysisJson.analyse_profil) {
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
      
      // Nouvelles sections par défaut
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
          risque_contentieux: "Non évalué"
        };
      }
      
      console.log("✅ JSON validé - Score:", analysisJson.score);
      
    } catch (parseError) {
      console.error("❌ Erreur parsing:", parseError.message);
      
      // Fallback
      analysisJson = {
        title: "Analyse partielle",
        type_marche: "Non déterminé",
        secteur: "Non déterminé",
        autorite: "N/A",
        lieu: "N/A",
        date_limite: "N/A",
        montant_estime: "N/A",
        contexte: "Analyse partielle - vérification manuelle recommandée",
        incompatibilite_critique: { detectee: false },
        criteres_attribution: [],
        documents_requis: [],
        certifications_requises: [],
        analyse_profil: {
          points_forts: ["Analyse en cours"],
          points_faibles: ["Données incomplètes"],
          ressources_a_mobiliser: ["À déterminer"],
          compatibilite: {
            geographique: "À vérifier",
            technique: "À vérifier",
            financiere: "À vérifier",
            temporelle: "À vérifier"
          }
        },
        analyse_concurrence: {
          niveau: "Non évalué",
          profils_concurrents: "N/A",
          barrieres_entree: [],
          avantages_differenciation: []
        },
        risques_juridiques_financiers: {
          clauses_penalites: "N/A",
          garantie_decennale: "N/A",
          assurance_responsabilite: "N/A",
          delais_paiement: "N/A",
          avance_versee: "N/A",
          risque_contentieux: "Non évalué"
        },
        score: 50,
        opportunity: "Analyse à compléter",
        justification_score: "Extraction incomplète",
        recommendations: {
          renforcer_dossier: "Relire document",
          ameliorer_profil: "Compléter infos",
          points_a_valoriser: "À déterminer",
          erreurs_a_eviter: "Vérifier manuellement"
        },
        plan_de_depot: ["Relire document", "Vérifier exigences"],
        checklist: ["Document lu", "Exigences identifiées"],
        alertes: ["Extraction automatique partielle"]
      };
    }

    // Suppression fichier
    try {
      fs.unlinkSync(filePath);
      console.log("🗑️ Fichier temporaire supprimé");
    } catch {}

    // Sauvegarde DB
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

        console.log(`💾 Analyse sauvegardée - ID: ${rows[0].id}`);

        return {
          success: true,
          _id: rows[0].id,
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
        contexte: `Erreur: ${err.message}`
      }
    };
  }
}
