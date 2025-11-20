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

    // ========== PROMPT ULTRA-COMPLET POUR PME ==========
    const prompt = `Tu es MyMír, expert en analyse d'appels d'offres SPÉCIALISÉ dans l'accompagnement des PME, TPE et startups françaises.

🎯 MISSION : Transformer une analyse d'appel d'offres en PLAN D'ACTION CONCRET et RÉALISTE pour une petite structure.

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
1️⃣1️⃣ 🎯 STRATÉGIE DE CANDIDATURE ADAPTÉE
═══════════════════════════════════════════

**SI score < 60/100**, fournis une stratégie détaillée et réaliste :

**Opportunités à valoriser** :
- Avantages spécifiques de CE marché (allotissement, durée, SAD, etc.)
- Points d'entrée possibles (lots accessibles, catégories spécifiques)
- Possibilités sous-traitance/partenariats
- Critères non-bloquants travaillables

**Stratégie recommandée** :
✅ **À FAIRE** : [2-4 actions stratégiques concrètes]
❌ **À NE PAS FAIRE** : [2-3 pièges à éviter absolument]
⚠️ **Conditions préalables** : [ce qu'il FAUT avoir AVANT de candidater]

**Feuille de route suggérée** (si score 40-59) :
- **Court terme (0-3 mois)** : [actions immédiates réalisables]
- **Moyen terme (3-12 mois)** : [développements requis]
- **Long terme (12+ mois)** : [positionnement stratégique]

**SI score ≥ 70/100**, stratégie allégée suffit.

═══════════════════════════════════════════
1️⃣2️⃣ 📋 PRÉPARATION DU DOSSIER
═══════════════════════════════════════════

**Complexité dossier** : Simple/Moyenne/Élevée

**Temps préparation estimé** :
- Rassemblement documents administratifs : [X jours]
- Rédaction mémoire technique : [X jours]
- Chiffrage/réponse financière : [X jours]
- **TOTAL estimé** : [X jours]

**Coûts préparation estimés** (si applicable) :
- Certifications manquantes : [montant ou N/A]
- Assurances complémentaires : [montant ou N/A]
- Conseils externes (avocat, consultant) : [montant estimé ou N/A]
- **TOTAL estimé** : [montant ou "Préparation interne possible"]

**Documents types à préparer en priorité** :
1. [Document 1 + où le trouver/comment le faire]
2. [Document 2 + où le trouver/comment le faire]
3. [Document 3 + où le trouver/comment le faire]

═══════════════════════════════════════════
1️⃣3️⃣ 📅 CALENDRIER DÉTAILLÉ
═══════════════════════════════════════════

Établis un rétro-planning depuis la date limite :

**J-[X] ([date])** : Date limite dépôt offres
**J-[X]** : Deadline interne (marge sécurité)
**J-[X]** : Finalisation et relecture
**J-[X]** : Rédaction mémoire technique
**J-[X]** : Chiffrage finalisé
**J-[X]** : Rassemblement documents admin
**AUJOURD'HUI** : [Date génération rapport]

**⚠️ Temps disponible** : [X jours] - [Court/Raisonnable/Confortable]

═══════════════════════════════════════════
1️⃣4️⃣ 🆘 AIDES & ACCOMPAGNEMENTS
═══════════════════════════════════════════

**Organismes d'aide aux PME** (selon secteur/localisation) :
- CCI locale : Accompagnement marchés publics
- BPI France : Garanties financières
- Régions : Aides sectorielles
- Fédérations professionnelles : Conseils métier

**Plateformes utiles** :
- Chorus Pro (facturation)
- PLACE (dépôt dématérialisé)
- data.gouv.fr (données marchés)

**Si besoin avocat/consultant** : [Oui/Non] + justification

═══════════════════════════════════════════
1️⃣5️⃣ PLAN DÉPÔT
═══════════════════════════════════════════
1. [Étape 1]
2. [Étape 2]
3. [Étape 3]
etc.

═══════════════════════════════════════════
1️⃣6️⃣ CHECKLIST FINALE
═══════════════════════════════════════════
☐ [Point 1]
☐ [Point 2]
etc.

═══════════════════════════════════════════
1️⃣7️⃣ ALERTES & SIGNAUX
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
  
  "score": 45,
  "opportunity": "Risqué",
  "justification_score": "Explication claire",
  
  "recommendations": {
    "renforcer_dossier": "Conseil",
    "ameliorer_profil": "Conseil",
    "points_a_valoriser": "Points",
    "erreurs_a_eviter": "Erreurs"
  },
  
  "strategie_candidature": {
    "opportunites_a_valoriser": ["Opportunité 1", "Opportunité 2"],
    "actions_recommandees": {
      "a_faire": ["Action 1", "Action 2"],
      "a_ne_pas_faire": ["Piège 1", "Piège 2"],
      "conditions_prealables": ["Condition 1", "Condition 2"]
    },
    "feuille_de_route": {
      "court_terme": ["Action 0-3 mois", "Action 2"],
      "moyen_terme": ["Action 3-12 mois", "Action 2"],
      "long_terme": ["Action 12+ mois", "Action 2"]
    }
  },
  
  "preparation_dossier": {
    "complexite": "Simple/Moyenne/Élevée",
    "temps_preparation": {
      "documents_admin": "X jours",
      "memoire_technique": "X jours",
      "chiffrage": "X jours",
      "total": "X jours"
    },
    "couts_preparation": {
      "certifications": "Montant ou N/A",
      "assurances": "Montant ou N/A",
      "conseils_externes": "Montant ou N/A",
      "total": "Montant ou 'Préparation interne possible'"
    },
    "documents_prioritaires": [
      "Document 1 + conseil obtention",
      "Document 2 + conseil obtention"
    ]
  },
  
  "calendrier": {
    "date_limite": "JJ/MM/AAAA",
    "deadline_interne_recommandee": "JJ/MM/AAAA",
    "temps_disponible_jours": 45,
    "appreciation_delai": "Court/Raisonnable/Confortable",
    "retro_planning": [
      {"date": "JJ/MM", "action": "Dépôt offre"},
      {"date": "JJ/MM", "action": "Finalisation"},
      {"date": "JJ/MM", "action": "Rédaction"},
      {"date": "JJ/MM", "action": "Début préparation"}
    ]
  },
  
  "aides_accompagnements": {
    "organismes_utiles": [
      "CCI locale - Accompagnement marchés publics",
      "BPI France - Garanties financières"
    ],
    "plateformes": ["Chorus Pro", "PLACE"],
    "besoin_conseil_externe": "Oui/Non + justification"
  },
  
  "plan_de_depot": ["Étape1", "Étape2"],
  "checklist": ["Point1", "Point2"],
  "alertes": ["Alerte1"] ou []
}

⚡ JSON uniquement, pas de markdown, pas de texte.`;

    console.log("🤖 Envoi OpenAI...");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        { 
          role: "system", 
          content: "Tu es MyMír, expert en accompagnement des PME/TPE pour les marchés publics. Tu fournis des analyses pragmatiques, honnêtes et ACTIONNABLES. Tu transformes l'analyse en plan d'action concret. JSON uniquement." 
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
      analysisJson.opportunity = "INCOMPATIBLE - Ne pas candidater";
    }
    
    analysisJson.type_marche = analysisJson.type_marche || "Non précisé";
    analysisJson.contexte = analysisJson.contexte || "Analyse terminée";
    analysisJson.documents_requis = analysisJson.documents_requis || [];
    analysisJson.criteres_attribution = analysisJson.criteres_attribution || [];
    
    // Valeurs par défaut pour nouvelles sections
    if (!analysisJson.analyse_profil) {
      analysisJson.analyse_profil = {
        points_forts: [],
        points_faibles: [],
        ressources_a_mobiliser: [],
        compatibilite: { 
          geographique: "N/A", 
          technique: "N/A", 
          financiere: "N/A", 
          temporelle: "N/A" 
        }
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
        actions_recommandees: {
          a_faire: [],
          a_ne_pas_faire: [],
          conditions_prealables: []
        },
        feuille_de_route: {
          court_terme: [],
          moyen_terme: [],
          long_terme: []
        }
      };
    }
    
    if (!analysisJson.preparation_dossier) {
      analysisJson.preparation_dossier = {
        complexite: "Non évaluée",
        temps_preparation: {
          documents_admin: "N/A",
          memoire_technique: "N/A",
          chiffrage: "N/A",
          total: "N/A"
        },
        couts_preparation: {
          certifications: "N/A",
          assurances: "N/A",
          conseils_externes: "N/A",
          total: "N/A"
        },
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

    try {
      fs.unlinkSync(filePath);
    } catch {}

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
