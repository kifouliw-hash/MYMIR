import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'https://mymir.onrender.com';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    companyName: '',
    name: '',
    email: '',
    sector: '',
    sousSecteur: '',
    effectif: '',
    country: '',
    revenue: '',
    certifications: '',
    siteWeb: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [activeParam, setActiveParam] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData({
        companyName: user.metadata?.companyName || '',
        name: user.name || '',
        email: user.email || '',
        sector: user.metadata?.sector || '',
        sousSecteur: user.metadata?.sousSecteur || '',
        effectif: user.metadata?.employees || user.metadata?.effectif || '',
        country: user.metadata?.country || '',
        revenue: user.metadata?.revenue || '',
        certifications: user.metadata?.certifications || '',
        siteWeb: user.metadata?.siteWeb || '',
        description: user.metadata?.description || ''
      });
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/analyses`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };

  const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setUploadProgress(true);
  setAnalysisResult(null);

  const formData = new FormData();
  formData.append('file', file);

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await response.json();
    if (response.ok) {
      // 🔥 Parser l'analysis si c'est une string
      if (data.analysis && typeof data.analysis === 'string') {
        try {
          data.analysis = JSON.parse(data.analysis);
        } catch (e) {
          console.error('Erreur parsing analysis:', e);
        }
      }
      setAnalysisResult(data);
      loadHistory();
    } else {
      alert('❌ ' + (data.message || 'Erreur lors de l\'analyse'));
    }
  } catch (error) {
    console.error('Erreur upload:', error);
    alert('❌ Erreur lors de l\'analyse');
  } finally {
    setUploadProgress(false);
  }
};

  const downloadPDF = async (analysisId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/analyses/${analysisId}/pdf`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analyse-${analysisId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      alert('❌ Erreur lors du téléchargement');
    }
  };

  const newAnalysis = () => {
    setAnalysisResult(null);
    document.getElementById('fileInput').value = '';
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const dataToSend = {
        companyName: profileData.companyName,
        country: profileData.country,
        sector: profileData.sector,
        sousSecteur: profileData.sousSecteur,
        effectif: profileData.effectif,
        revenue: profileData.revenue,
        certifications: profileData.certifications,
        siteWeb: profileData.siteWeb,
        description: profileData.description
      };

      const response = await fetch(`${API_URL}/api/update-profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();
      if (response.ok) {
        alert('✅ Profil mis à jour avec succès !');
        setIsEditingProfile(false);
      } else {
        alert('❌ ' + (data.message || 'Erreur lors de la mise à jour'));
      }
    } catch (error) {
      console.error('Erreur MAJ profil:', error);
      alert('❌ Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const renderParamContent = (param) => {
    const contents = {
      support: (
        <div className="param-content">
          <h3>📧 Support technique</h3>
          <div style={{marginBottom: '30px'}}>
            <h4>Besoin d'assistance ?</h4>
            <p>Notre équipe support est disponible 24/7 pour répondre à toutes vos questions et résoudre vos problèmes techniques.</p>
          </div>
          
          <div style={{marginBottom: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
            <h4>📞 Coordonnées</h4>
            <p><strong>Email :</strong> support@mymir.com</p>
            <p><strong>Téléphone :</strong> +33 (0)1 23 45 67 89</p>
            <p><strong>Horaires :</strong> Disponible 24h/24, 7j/7</p>
            <p><strong>Temps de réponse moyen :</strong> Moins de 2 heures</p>
          </div>

          <div style={{marginBottom: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
            <h4>🎯 Types de support disponibles</h4>
            <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
              <li><strong>Support technique :</strong> Problèmes de connexion, bugs, erreurs système</li>
              <li><strong>Aide à l'utilisation :</strong> Questions sur les fonctionnalités et la navigation</li>
              <li><strong>Accompagnement métier :</strong> Conseils sur l'analyse des appels d'offres</li>
              <li><strong>Formation :</strong> Sessions de formation personnalisées sur demande</li>
              <li><strong>Développement custom :</strong> Demandes de fonctionnalités spécifiques</li>
            </ul>
          </div>

          <div style={{marginBottom: '20px', padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
            <h4>💬 Formulaire de contact rapide</h4>
            <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px'}}>
              <select className="field-input">
                <option>Sélectionner le type de demande</option>
                <option>Problème technique</option>
                <option>Question sur l'utilisation</option>
                <option>Demande de fonctionnalité</option>
                <option>Facturation</option>
                <option>Autre</option>
              </select>
              <textarea 
                className="field-textarea" 
                rows="4" 
                placeholder="Décrivez votre demande en détail..."
              />
              <button className="btn-primary" style={{width: 'fit-content'}}>
                Envoyer la demande →
              </button>
            </div>
          </div>

          <div style={{padding: '15px', background: 'rgba(244, 178, 35, 0.1)', borderRadius: '10px', borderLeft: '4px solid #f4b223'}}>
            <strong>💡 Astuce :</strong> Pour un support prioritaire, incluez votre ID d'utilisateur et des captures d'écran si possible.
          </div>
        </div>
      ),

      legal: (
        <div className="param-content">
          <h3>📄 Mentions légales</h3>
          
          <div style={{marginBottom: '25px'}}>
            <h4>Informations générales</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', lineHeight: '1.8'}}>
              <p><strong>Raison sociale :</strong> MyMír SAS</p>
              <p><strong>Forme juridique :</strong> Société par Actions Simplifiée</p>
              <p><strong>Capital social :</strong> 50 000 €</p>
              <p><strong>SIRET :</strong> 123 456 789 00012</p>
              <p><strong>TVA Intracommunautaire :</strong> FR12345678900</p>
              <p><strong>Code APE/NAF :</strong> 6201Z (Programmation informatique)</p>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>Siège social</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <p>123 rue de la Technologie</p>
              <p>75001 Paris, France</p>
              <p><strong>Téléphone :</strong> +33 (0)1 23 45 67 89</p>
              <p><strong>Email :</strong> contact@mymir.com</p>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>Direction de la publication</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <p><strong>Directeur de la publication :</strong> Williams Kifouli</p>
              <p><strong>Fonction :</strong> Président</p>
              <p><strong>Contact :</strong> direction@mymir.com</p>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>Hébergement</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <p><strong>Hébergeur :</strong> Render Technologies Inc.</p>
              <p><strong>Adresse :</strong> 525 Brannan Street, San Francisco, CA 94107, USA</p>
              <p><strong>Site web :</strong> https://render.com</p>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>Propriété intellectuelle</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', lineHeight: '1.8'}}>
              <p>L'ensemble du contenu de ce site (structure, textes, logos, images, vidéos, bases de données) est la propriété exclusive de MyMír SAS, sauf mention contraire.</p>
              <p style={{marginTop: '10px'}}>Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de MyMír SAS.</p>
              <p style={{marginTop: '10px'}}><strong>© 2025 MyMír - Tous droits réservés</strong></p>
            </div>
          </div>

          <div style={{padding: '15px', background: 'rgba(244, 178, 35, 0.1)', borderRadius: '10px', borderLeft: '4px solid #f4b223'}}>
            <strong>⚖️ Loi applicable :</strong> Les présentes mentions légales sont soumises au droit français. Tout litige relatif à l'utilisation du site relève de la compétence exclusive des tribunaux français.
          </div>
        </div>
      ),

      privacy: (
        <div className="param-content">
          <h3>🔒 Politique de confidentialité</h3>
          
          <div style={{marginBottom: '25px'}}>
            <h4>Notre engagement RGPD</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', lineHeight: '1.8'}}>
              <p>MyMír est pleinement conforme au Règlement Général sur la Protection des Données (RGPD) et s'engage à protéger la confidentialité et la sécurité de vos données personnelles.</p>
              <p style={{marginTop: '10px'}}><strong>Responsable du traitement :</strong> MyMír SAS</p>
              <p><strong>DPO (Délégué à la Protection des Données) :</strong> dpo@mymir.com</p>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>1. Données collectées</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <li><strong>Données d'identification :</strong> nom, prénom, email, téléphone</li>
                <li><strong>Données professionnelles :</strong> entreprise, secteur d'activité, effectif</li>
                <li><strong>Données de connexion :</strong> adresse IP, logs de connexion, cookies</li>
                <li><strong>Données d'utilisation :</strong> analyses effectuées, documents uploadés</li>
                <li><strong>Données financières :</strong> informations de facturation (cryptées)</li>
              </ul>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>2. Finalités du traitement</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <li>Fourniture et amélioration des services MyMír</li>
                <li>Gestion de votre compte utilisateur</li>
                <li>Traitement de vos analyses d'appels d'offres</li>
                <li>Communication commerciale (avec votre consentement)</li>
                <li>Facturation et comptabilité</li>
                <li>Respect des obligations légales</li>
                <li>Statistiques et amélioration de l'expérience utilisateur</li>
              </ul>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>3. Sécurité des données</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <li>🔐 <strong>Cryptage SSL/TLS</strong> pour toutes les communications</li>
                <li>🛡️ <strong>Encryption AES-256</strong> pour le stockage des données sensibles</li>
                <li>🔒 <strong>Authentification sécurisée</strong> avec tokens JWT</li>
                <li>💾 <strong>Sauvegardes automatiques</strong> quotidiennes</li>
                <li>🚨 <strong>Monitoring 24/7</strong> et détection d'intrusions</li>
                <li>👥 <strong>Accès restreints</strong> au personnel autorisé uniquement</li>
                <li>📋 <strong>Audits de sécurité</strong> réguliers par des experts tiers</li>
              </ul>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>4. Vos droits</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <p style={{marginBottom: '15px'}}>Conformément au RGPD, vous disposez des droits suivants :</p>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
                <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
                <li><strong>Droit à l'effacement :</strong> supprimer vos données (« droit à l'oubli »)</li>
                <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
                <li><strong>Droit à la portabilité :</strong> récupérer vos données dans un format structuré</li>
                <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
                <li><strong>Droit de retrait du consentement :</strong> à tout moment</li>
              </ul>
              <p style={{marginTop: '15px'}}>Pour exercer vos droits : <strong>privacy@mymir.com</strong></p>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>5. Conservation des données</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <li><strong>Données de compte :</strong> durée de votre abonnement + 3 ans</li>
                <li><strong>Analyses et documents :</strong> durée de votre abonnement + 1 an</li>
                <li><strong>Données de facturation :</strong> 10 ans (obligation légale)</li>
                <li><strong>Logs de connexion :</strong> 12 mois maximum</li>
              </ul>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>6. Cookies et traceurs</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <p>Nous utilisons des cookies strictement nécessaires au fonctionnement du site :</p>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)', marginTop: '10px'}}>
                <li><strong>Cookies de session :</strong> authentification et sécurité</li>
                <li><strong>Cookies de préférence :</strong> langue, paramètres d'affichage</li>
              </ul>
              <p style={{marginTop: '15px'}}>❌ <strong>Nous n'utilisons PAS de cookies publicitaires ou de tracking tiers</strong></p>
            </div>
          </div>

          <div style={{padding: '15px', background: 'rgba(244, 178, 35, 0.1)', borderRadius: '10px', borderLeft: '4px solid #f4b223'}}>
            <strong>📅 Dernière mise à jour :</strong> 17 novembre 2025<br/>
            <strong>📧 Contact DPO :</strong> dpo@mymir.com
          </div>
        </div>
      ),

      terms: (
        <div className="param-content">
          <h3>📋 Conditions Générales d'Utilisation & de Vente</h3>
          
          <div style={{marginBottom: '25px'}}>
            <h4>CGU - Conditions Générales d'Utilisation</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <h5 style={{color: '#f4b223', marginTop: '15px'}}>Article 1 - Objet</h5>
              <p style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme MyMír, service SaaS d'analyse d'appels d'offres par intelligence artificielle.
              </p>

              <h5 style={{color: '#f4b223', marginTop: '20px'}}>Article 2 - Acceptation des CGU</h5>
              <p style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                L'utilisation de MyMír implique l'acceptation pleine et entière des présentes CGU. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le service.
              </p>

              <h5 style={{color: '#f4b223', marginTop: '20px'}}>Article 3 - Accès au service</h5>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <li>Création d'un compte personnel obligatoire</li>
                <li>Informations d'inscription exactes et à jour</li>
                <li>Confidentialité des identifiants de connexion</li>
                <li>Notification immédiate en cas d'utilisation non autorisée</li>
                <li>Interdiction de partage de compte</li>
              </ul>

              <h5 style={{color: '#f4b223', marginTop: '20px'}}>Article 4 - Utilisation du service</h5>
              <p style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)', marginBottom: '10px'}}>
                <strong>Vous vous engagez à :</strong>
              </p>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <li>Utiliser le service de manière légale et éthique</li>
                <li>Ne pas tenter de contourner les mesures de sécurité</li>
                <li>Ne pas surcharger ou perturber le système</li>
                <li>Respecter les droits de propriété intellectuelle</li>
                <li>Ne pas uploader de contenu illégal ou malveillant</li>
              </ul>

              <h5 style={{color: '#f4b223', marginTop: '20px'}}>Article 5 - Propriété intellectuelle</h5>
              <p style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                Tous les éléments de MyMír (code, design, algorithmes, base de données) sont protégés par le droit d'auteur. Vous conservez la propriété de vos documents uploadés. MyMír obtient une licence d'utilisation limitée pour fournir le service d'analyse.
              </p>

              <h5 style={{color: '#f4b223', marginTop: '20px'}}>Article 6 - Responsabilité</h5>
              <p style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                MyMír fournit un outil d'aide à la décision. Les analyses générées ne constituent pas des conseils juridiques ou professionnels. L'utilisateur reste seul responsable des décisions prises sur la base des analyses fournies.
              </p>

              <h5 style={{color: '#f4b223', marginTop: '20px'}}>Article 7 - Disponibilité du service</h5>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <li>Objectif de disponibilité : 99,5% du temps</li>
                <li>Maintenance programmée notifiée 48h à l'avance</li>
                <li>Interruptions d'urgence possibles sans préavis</li>
              </ul>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>CGV - Conditions Générales de Vente</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <h5 style={{color: '#f4b223', marginTop: '15px'}}>Article 1 - Offres et tarifs</h5>
              <p style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                Les tarifs sont indiqués en euros TTC. MyMír se réserve le droit de modifier ses tarifs à tout moment, avec notification préalable de 30 jours pour les abonnements en cours.
              </p>

              <h5 style={{color: '#f4b223', marginTop: '20px'}}>Article 2 - Formules d'abonnement</h5>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <li><strong>Starter :</strong> 49€/mois - 10 analyses/mois</li>
                <li><strong>Professional :</strong> 149€/mois - 50 analyses/mois</li>
                <li><strong>Enterprise :</strong> Sur devis - analyses illimitées</li>
              </ul>

              <h5 style={{color: '#f4b223', marginTop: '20px'}}>Article 3 - Modalités de paiement</h5>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <li>Paiement mensuel ou annuel par carte bancaire</li>
                <li>Prélèvement automatique le 1er de chaque mois</li>
                <li>Facture envoyée par email sous 24h</li>
                <li>Paiements sécurisés via Stripe</li>
              </ul>

              <h5 style={{color: '#f4b223', marginTop: '20px'}}>Article 4 - Droit de rétractation</h5>
              <p style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                Conformément à l'article L221-28 du Code de la consommation, vous disposez d'un délai de 14 jours pour exercer votre droit de rétractation, sans avoir à justifier de motifs ni à payer de pénalités.
              </p>

              <h5 style={{color: '#f4b223', marginTop: '20px'}}>Article 5 - Résiliation</h5>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <li>Résiliation possible à tout moment depuis votre compte</li>
                <li>Effective à la fin de la période en cours</li>
                <li>Aucun remboursement au prorata</li>
                <li>Conservation des données 30 jours après résiliation</li>
              </ul>

              <h5 style={{color: '#f4b223', marginTop: '20px'}}>Article 6 - Garanties</h5>
              <p style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                MyMír garantit la conformité du service aux fonctionnalités décrites. En cas de non-conformité, vous disposez d'un recours auprès du service client dans un délai de 30 jours.
              </p>

              <h5 style={{color: '#f4b223', marginTop: '20px'}}>Article 7 - Facturation</h5>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <li>Facturation automatique chaque mois</li>
                <li>Factures disponibles dans votre espace client</li>
                <li>TVA applicable selon législation en vigueur</li>
                <li>Numéro de TVA intracommunautaire accepté pour professionnels UE</li>
              </ul>
            </div>
          </div>

          <div style={{padding: '15px', background: 'rgba(244, 178, 35, 0.1)', borderRadius: '10px', borderLeft: '4px solid #f4b223'}}>
            <strong>📅 Version :</strong> 2.1 - Dernière mise à jour : 17 novembre 2025<br/>
            <strong>📧 Questions :</strong> legal@mymir.com
          </div>
        </div>
      ),

      language: (
        <div className="param-content">
          <h3>🌐 Paramètres de langue</h3>
          
          <div style={{marginBottom: '25px'}}>
            <h4>Langue de l'interface</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <p style={{marginBottom: '15px', color: 'rgba(255,255,255,0.8)'}}>
                Sélectionnez la langue d'affichage de votre interface MyMír. Cette modification s'appliquera immédiatement à l'ensemble de l'application.
              </p>
              
              <div style={{marginTop: '20px'}}>
                <label className="field-label">Langue principale</label>
                <select className="field-input" style={{width: '100%'}}>
                  <option value="fr">🇫🇷 Français (France)</option>
                  <option value="en">🇬🇧 English (United Kingdom)</option>
                  <option value="en-us">🇺🇸 English (United States)</option>
                  <option value="es">🇪🇸 Español (España)</option>
                  <option value="de">🇩🇪 Deutsch (Deutschland)</option>
                  <option value="it">🇮🇹 Italiano (Italia)</option>
                  <option value="pt">🇵🇹 Português (Portugal)</option>
                  <option value="nl">🇳🇱 Nederlands (Nederland)</option>
                  <option value="pl">🇵🇱 Polski (Polska)</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>Langue des analyses IA</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <p style={{marginBottom: '15px', color: 'rgba(255,255,255,0.8)'}}>
                Choisissez la langue dans laquelle les analyses d'appels d'offres seront générées.
              </p>
              
              <div style={{marginTop: '20px'}}>
                <label className="field-label">Langue des rapports</label>
                <select className="field-input" style={{width: '100%'}}>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>Format régional</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <p style={{marginBottom: '15px', color: 'rgba(255,255,255,0.8)'}}>
                Personnalisez les formats de date, heure et nombres selon vos préférences régionales.
              </p>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px'}}>
                <div>
                  <label className="field-label">Format de date</label>
                  <select className="field-input" style={{width: '100%'}}>
                    <option>JJ/MM/AAAA (17/11/2025)</option>
                    <option>MM/JJ/AAAA (11/17/2025)</option>
                    <option>AAAA-MM-JJ (2025-11-17)</option>
                  </select>
                </div>
                
                <div>
                  <label className="field-label">Format d'heure</label>
                  <select className="field-input" style={{width: '100%'}}>
                    <option>24 heures (14:30)</option>
                    <option>12 heures (02:30 PM)</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Fuseau horaire</label>
                  <select className="field-input" style={{width: '100%'}}>
                    <option>Europe/Paris (UTC+1)</option>
                    <option>Europe/London (UTC+0)</option>
                    <option>America/New_York (UTC-5)</option>
                    <option>Asia/Tokyo (UTC+9)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>Préférences de communication</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <div>
                <label className="field-label">Langue des emails de notification</label>
                <select className="field-input" style={{width: '100%'}}>
                  <option>Identique à la langue de l'interface</option>
                  <option>Français</option>
                  <option>English</option>
                  <option>Español</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
            <button className="btn-primary">
              💾 Enregistrer les modifications
            </button>
            <button className="btn-secondary">
              Annuler
            </button>
          </div>

          <div style={{padding: '15px', background: 'rgba(244, 178, 35, 0.1)', borderRadius: '10px', borderLeft: '4px solid #f4b223', marginTop: '20px'}}>
            <strong>💡 Info :</strong> Les modifications de langue prendront effet immédiatement. Certaines pages peuvent nécessiter un rafraîchissement.
          </div>
        </div>
      ),

      about: (
        <div className="param-content">
          <h3>ℹ️ À propos de MyMír</h3>
          
          <div style={{textAlign: 'center', marginBottom: '30px', padding: '30px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
            <div style={{fontSize: '64px', marginBottom: '15px'}}>🎯</div>
            <h2 style={{color: '#f4b223', fontSize: '32px', marginBottom: '10px'}}>MyMír</h2>
            <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '18px'}}>
              L'intelligence artificielle au service de vos appels d'offres
            </p>
            <p style={{marginTop: '10px', fontWeight: 'bold'}}>Version 1.0.0</p>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>Notre mission</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <p style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                MyMír révolutionne la réponse aux appels d'offres en combinant intelligence artificielle de pointe et expertise métier. Notre plateforme analyse automatiquement vos documents DCE, identifie les opportunités stratégiques, et vous aide à prendre des décisions éclairées en quelques secondes.
              </p>
              <p style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)', marginTop: '15px'}}>
                Nous croyons que chaque entreprise, quelle que soit sa taille, mérite d'accéder aux mêmes outils d'analyse sophistiqués que les grandes corporations. C'est pourquoi nous avons créé MyMír : démocratiser l'analyse d'appels d'offres grâce à l'IA.
              </p>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>Fonctionnalités principales</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <ul style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <li>🤖 <strong>Analyse IA avancée :</strong> Extraction intelligente des critères clés</li>
                <li>📊 <strong>Score de pertinence :</strong> Évaluation automatique de vos chances</li>
                <li>⚡ <strong>Traitement instantané :</strong> Analyse complète en moins de 30 secondes</li>
                <li>📄 <strong>Rapports PDF :</strong> Exports professionnels personnalisables</li>
                <li>📚 <strong>Historique complet :</strong> Toutes vos analyses accessibles</li>
                <li>🎯 <strong>Recommandations :</strong> Suggestions d'actions concrètes</li>
                <li>🔒 <strong>Sécurité maximale :</strong> Données cryptées et conformité RGPD</li>
              </ul>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>Technologies utilisées</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div>
                  <p><strong>🧠 Intelligence Artificielle</strong></p>
                  <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '14px'}}>GPT-4, Claude, modèles propriétaires</p>
                </div>
                <div>
                  <p><strong>☁️ Cloud Infrastructure</strong></p>
                  <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '14px'}}>AWS, Render, architecture scalable</p>
                </div>
                <div>
                  <p><strong>🔐 Sécurité</strong></p>
                  <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '14px'}}>SSL/TLS, JWT, encryption AES-256</p>
                </div>
                <div>
                  <p><strong>⚛️ Frontend moderne</strong></p>
                  <p style={{color: 'rgba(255,255,255,0.6)', fontSize: '14px'}}>React 18, design système premium</p>
                </div>
              </div>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>L'équipe MyMír</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <p style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                MyMír a été fondée en 2024 par une équipe d'experts en IA, développement logiciel et marchés publics. Notre équipe pluridisciplinaire combine expertise technique et connaissance approfondie des processus d'appels d'offres.
              </p>
              <p style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)', marginTop: '10px'}}>
                Nous sommes basés à Paris et travaillons avec des clients dans toute l'Europe francophone.
              </p>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>Statistiques de la plateforme</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', textAlign: 'center'}}>
                <div>
                  <div style={{fontSize: '32px', color: '#f4b223', fontWeight: 'bold'}}>15K+</div>
                  <div style={{color: 'rgba(255,255,255,0.6)'}}>Analyses effectuées</div>
                </div>
                <div>
                  <div style={{fontSize: '32px', color: '#f4b223', fontWeight: 'bold'}}>500+</div>
                  <div style={{color: 'rgba(255,255,255,0.6)'}}>Entreprises clientes</div>
                </div>
                <div>
                  <div style={{fontSize: '32px', color: '#f4b223', fontWeight: 'bold'}}>92%</div>
                  <div style={{color: 'rgba(255,255,255,0.6)'}}>Taux de satisfaction</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{marginBottom: '25px'}}>
            <h4>Informations légales</h4>
            <div style={{padding: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px'}}>
              <p style={{lineHeight: '1.8', color: 'rgba(255,255,255,0.8)'}}>
                <strong>MyMír SAS</strong><br/>
                Capital social : 50 000 €<br/>
                SIRET : 123 456 789 00012<br/>
                © 2024-2025 MyMír - Tous droits réservés
              </p>
            </div>
          </div>

          <div style={{display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '30px'}}>
            <button className="btn-primary">
              🌐 Visitez notre site web
            </button>
            <button className="btn-secondary">
              📧 Nous contacter
            </button>
          </div>

          <div style={{padding: '15px', background: 'rgba(244, 178, 35, 0.1)', borderRadius: '10px', borderLeft: '4px solid #f4b223', marginTop: '30px', textAlign: 'center'}}>
            <strong>💙 Merci de faire confiance à MyMír pour vos appels d'offres !</strong>
          </div>
        </div>
      )
    };
    return contents[param] || null;
  };

  return (
    <div className="dashboard">
      <div className="background-gradient"></div>
      <div className="mesh-gradient"></div>

      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-container">
            <div className="logo-circle">
              <span className="logo-letter">M</span>
            </div>
            <div className="logo-glow"></div>
          </div>
          <h1 className="brand-name">MyMír</h1>
        </div>

        <div className="user-profile-card">
          <div className="user-avatar">
            <span>{(profileData.companyName || 'E').charAt(0).toUpperCase()}</span>
          </div>
          <div className="user-details">
            <p className="user-company">{profileData.companyName || 'Entreprise'}</p>
            <p className="user-name">{profileData.name}</p>
          </div>
        </div>

        <nav className="nav-section">
          <button
            className={`nav-item ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => setActiveSection('home')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-text">Accueil</span>
            <span className="nav-indicator"></span>
          </button>

          <button
            className={`nav-item ${activeSection === 'analyse' ? 'active' : ''}`}
            onClick={() => setActiveSection('analyse')}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Analyse</span>
            <span className="nav-indicator"></span>
          </button>

          <button
            className={`nav-item ${activeSection === 'aide' ? 'active' : ''}`}
            onClick={() => setActiveSection('aide')}
          >
            <span className="nav-icon">💡</span>
            <span className="nav-text">Aide</span>
            <span className="nav-indicator"></span>
          </button>

          <button
            className={`nav-item ${activeSection === 'historique' ? 'active' : ''}`}
            onClick={() => setActiveSection('historique')}
          >
            <span className="nav-icon">📜</span>
            <span className="nav-text">Historique</span>
            <span className="nav-indicator"></span>
          </button>

          <button
            className={`nav-item ${activeSection === 'profil' ? 'active' : ''}`}
            onClick={() => setActiveSection('profil')}
          >
            <span className="nav-icon">👤</span>
            <span className="nav-text">Profil</span>
            <span className="nav-indicator"></span>
          </button>

          <button
            className={`nav-item ${activeSection === 'parametres' ? 'active' : ''}`}
            onClick={() => setActiveSection('parametres')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-text">Paramètres</span>
            <span className="nav-indicator"></span>
          </button>
        </nav>

        <div className="logout-section">
          <button className="logout-btn" onClick={logout}>
            <span className="logout-icon">→</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        {activeSection === 'home' && (
          <section className="section">
            <div className="hero-card">
              <h1 className="hero-title">
                Bienvenue {profileData.name} 
                <span className="wave-emoji">👋</span>
              </h1>
              <p className="hero-subtitle">
                Optimisez vos appels d'offres avec MyMír, votre assistant intelligent.
              </p>
              <button className="cta-primary" onClick={() => setActiveSection('analyse')}>
                <span>Nouvelle analyse</span>
                <span className="cta-arrow">→</span>
              </button>
            </div>

            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-icon-wrapper">
                  <span className="metric-icon">📊</span>
                </div>
                <div className="metric-content">
                  <h3 className="metric-value">{history.length}</h3>
                  <p className="metric-label">Analyses</p>
                </div>
                <div className="metric-trend positive">↗ +12%</div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrapper">
                  <span className="metric-icon">✅</span>
                </div>
                <div className="metric-content">
                  <h3 className="metric-value">89%</h3>
                  <p className="metric-label">Taux de réussite</p>
                </div>
                <div className="metric-trend positive">↗ +5%</div>
              </div>

              <div className="metric-card">
                <div className="metric-icon-wrapper">
                  <span className="metric-icon">⏱️</span>
                </div>
                <div className="metric-content">
                  <h3 className="metric-value">36h</h3>
                  <p className="metric-label">Temps économisé</p>
                </div>
                <div className="metric-trend positive">↗ +8h</div>
              </div>
            </div>
          </section>
        )}

        {activeSection === 'analyse' && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Analyse d'opportunités</h2>
              <p className="section-description">
                Importez un document d'appels d'offres et obtenez une analyse complète en quelques secondes
              </p>
            </div>

            <div className="upload-container">
              <input
                type="file"
                id="fileInput"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                hidden
              />
              <div 
                className="upload-dropzone"
                onClick={() => document.getElementById('fileInput').click()}
              >
                <div className="upload-icon">📁</div>
                <h3 className="upload-title">Glissez votre document ici</h3>
                <p className="upload-subtitle">ou cliquez pour parcourir</p>
                <button className="upload-btn" disabled={uploadProgress}>
                  {uploadProgress ? 'Analyse en cours...' : 'Sélectionner un fichier'}
                </button>
              </div>
            </div>

            {uploadProgress && (
              <div className="progress-card">
                <div className="progress-spinner"></div>
                <p className="progress-text">Analyse en cours...</p>
              </div>
            )}

            {analysisResult && (
              <div className="result-card">
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
                  <h3 className="result-title">✅ Analyse terminée</h3>
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button className="btn-primary" onClick={() => downloadPDF(analysisResult._id)}>
                      📥 Télécharger PDF
                    </button>
                    <button className="btn-secondary" onClick={newAnalysis}>
                      🔄 Nouvelle analyse
                    </button>
                  </div>
                </div>
                
                <div className="analysis-summary">
                  <div className="summary-item">
                    <strong>Marché :</strong> {analysisResult.analysis?.title || 'N/A'}
                  </div>
                  <div className="summary-item">
                    <strong>Score :</strong> <span className="score-badge high">{analysisResult.analysis?.opportunity || 'N/A'}</span>
                  </div>
                  <div className="summary-item">
                    <strong>Date limite :</strong> {analysisResult.analysis?.date_limite || 'N/A'}
                  </div>
                  <div className="summary-item">
                    <strong>Contexte :</strong> {analysisResult.analysis?.contexte || 'N/A'}
                  </div>
                  <div className="summary-item">
                    <strong>Recommandations :</strong> {analysisResult.analysis?.recommendations || 'N/A'}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {activeSection === 'aide' && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Outils d'aide à la réponse</h2>
              <p className="section-description">
                Gagnez du temps avec nos templates et assistants intelligents
              </p>
            </div>

            <div className="tools-grid">
              <div className="tool-card">
                <div className="tool-icon">📝</div>
                <h3 className="tool-title">Lettre de candidature</h3>
                <p className="tool-description">
                  Générez une lettre professionnelle adaptée à votre entreprise
                </p>
                <button className="tool-btn">Générer →</button>
              </div>

              <div className="tool-card">
                <div className="tool-icon">🏗️</div>
                <h3 className="tool-title">Moyens techniques</h3>
                <p className="tool-description">
                  Décrivez vos moyens humains et matériels automatiquement
                </p>
                <button className="tool-btn">Créer →</button>
              </div>

              <div className="tool-card">
                <div className="tool-icon">✅</div>
                <h3 className="tool-title">Check-list</h3>
                <p className="tool-description">
                  Vérifiez la complétude de votre dossier avant envoi
                </p>
                <button className="tool-btn">Vérifier →</button>
              </div>
            </div>
          </section>
        )}

        {activeSection === 'historique' && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Historique des analyses</h2>
              <p className="section-description">Consultez vos analyses précédentes</p>
            </div>

            <div className="table-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Marché</th>
                    <th>Score</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item._id}>
                      <td className="table-date">{new Date(item.generated_at).toLocaleDateString('fr-FR')}</td>
                      <td className="table-title">{item.analysis?.title || 'Sans titre'}</td>
                      <td><span className="score-badge high">{item.analysis?.opportunity || 'N/A'}</span></td>
                      <td><span className="status-badge success">Terminé</span></td>
                      <td className="table-actions">
                        <button className="action-btn" onClick={() => downloadPDF(item._id)}>📥</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeSection === 'profil' && (
          <section className="section">
            <div className="profile-header-bar">
              <div>
                <h2 className="section-title">Profil de l'entreprise</h2>
                <p className="section-description">Gérez les informations de votre entreprise</p>
              </div>
              <div className="profile-actions">
                {!isEditingProfile ? (
                  <button 
                    className="btn-secondary"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    <span>✏️</span>
                    <span>Modifier</span>
                  </button>
                ) : (
                  <>
                    <button 
                      className="btn-secondary"
                      onClick={() => setIsEditingProfile(false)}
                    >
                      Annuler
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={handleProfileUpdate}
                      disabled={loading}
                    >
                      <span>{loading ? '⏳' : '💾'}</span>
                      <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            <form className="profile-form" onSubmit={handleProfileUpdate}>
              <div className="form-grid">
                <div className="form-field">
                  <label className="field-label">Entreprise</label>
                  <input
                    type="text"
                    className="field-input"
                    value={profileData.companyName}
                    onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                    placeholder="Nom de l'entreprise"
                    disabled={!isEditingProfile}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Pays</label>
                  <select
                    className="field-input"
                    value={profileData.country}
                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    disabled={!isEditingProfile}
                  >
                    <option value="">Sélectionner</option>
                    <option value="France">France</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Luxembourg">Luxembourg</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Secteur d'activité</label>
                  <select
                    className="field-input"
                    value={profileData.sector}
                    onChange={(e) => setProfileData({ ...profileData, sector: e.target.value })}
                    disabled={!isEditingProfile}
                  >
                    <option value="">Sélectionner</option>
                    <option value="BTP / Construction">BTP / Construction</option>
                    <option value="Conseil / Ingénierie">Conseil / Ingénierie</option>
                    <option value="Informatique">Informatique</option>
                    <option value="Services">Services</option>
                    <option value="Santé">Santé</option>
                    <option value="Transport">Transport</option>
                    <option value="Environnement">Environnement</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Sous-secteur</label>
                  <input
                    type="text"
                    className="field-input"
                    value={profileData.sousSecteur}
                    onChange={(e) => setProfileData({ ...profileData, sousSecteur: e.target.value })}
                    placeholder="Ex : Génie civil"
                    disabled={!isEditingProfile}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Effectif</label>
                  <select
                    className="field-input"
                    value={profileData.effectif}
                    onChange={(e) => setProfileData({ ...profileData, effectif: e.target.value })}
                    disabled={!isEditingProfile}
                  >
                    <option value="">Sélectionner</option>
                    <option value="1">1</option>
                    <option value="2-5">2-5</option>
                    <option value="6-20">6-20</option>
                    <option value="21-50">21-50</option>
                    <option value="51-100">51-100</option>
                    <option value="100+">100+</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Chiffre d'affaires annuel</label>
                  <select
                    className="field-input"
                    value={profileData.revenue}
                    onChange={(e) => setProfileData({ ...profileData, revenue: e.target.value })}
                    disabled={!isEditingProfile}
                  >
                    <option value="">Sélectionner</option>
                    <option value="< 100k €">{"< 100k €"}</option>
                    <option value="100k - 500k €">100k - 500k €</option>
                    <option value="500k - 1M €">500k - 1M €</option>
                    <option value="1M - 5M €">1M - 5M €</option>
                    <option value="5M - 10M €">5M - 10M €</option>
                    <option value="> 10M €">{"> 10M €"}</option>
                  </select>
                </div>

                <div className="form-field">
                  <label className="field-label">Certifications</label>
                  <input
                    type="text"
                    className="field-input"
                    value={profileData.certifications}
                    onChange={(e) => setProfileData({ ...profileData, certifications: e.target.value })}
                    placeholder="Ex : ISO 9001, Qualibat"
                    disabled={!isEditingProfile}
                  />
                </div>

                <div className="form-field">
                  <label className="field-label">Site web</label>
                  <input
                    type="url"
                    className="field-input"
                    value={profileData.siteWeb}
                    onChange={(e) => setProfileData({ ...profileData, siteWeb: e.target.value })}
                    placeholder="https://votre-site.com"
                    disabled={!isEditingProfile}
                  />
                </div>

                <div className="form-field full-width">
                  <label className="field-label">Description</label>
                  <textarea
                    className="field-textarea"
                    rows="4"
                    value={profileData.description}
                    onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                    placeholder="Présentez brièvement votre activité..."
                    disabled={!isEditingProfile}
                  />
                </div>
              </div>
            </form>
          </section>
        )}

        {activeSection === 'parametres' && (
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Paramètres et informations</h2>
              <p className="section-description">Gérez vos préférences et accédez aux informations légales</p>
            </div>

            <div className="tools-grid">
              <div className="tool-card" onClick={() => setActiveParam(activeParam === 'support' ? null : 'support')}>
                <div className="tool-icon">📧</div>
                <h3 className="tool-title">Support technique</h3>
                <p className="tool-description">
                  Besoin d'aide ? Contactez notre équipe support disponible 24/7
                </p>
                <button className="tool-btn">Contacter →</button>
              </div>

              <div className="tool-card" onClick={() => setActiveParam(activeParam === 'legal' ? null : 'legal')}>
                <div className="tool-icon">📄</div>
                <h3 className="tool-title">Mentions légales</h3>
                <p className="tool-description">
                  Consultez nos mentions légales et informations juridiques
                </p>
                <button className="tool-btn">Consulter →</button>
              </div>

              <div className="tool-card" onClick={() => setActiveParam(activeParam === 'privacy' ? null : 'privacy')}>
                <div className="tool-icon">🔒</div>
                <h3 className="tool-title">Confidentialité</h3>
                <p className="tool-description">
                  Politique de confidentialité et gestion de vos données personnelles
                </p>
                <button className="tool-btn">Lire →</button>
              </div>

              <div className="tool-card" onClick={() => setActiveParam(activeParam === 'terms' ? null : 'terms')}>
                <div className="tool-icon">📋</div>
                <h3 className="tool-title">CGU & CGV</h3>
                <p className="tool-description">
                  Conditions générales d'utilisation et de vente
                </p>
                <button className="tool-btn">Consulter →</button>
              </div>

              <div className="tool-card" onClick={() => setActiveParam(activeParam === 'language' ? null : 'language')}>
                <div className="tool-icon">🌐</div>
                <h3 className="tool-title">Langue</h3>
                <p className="tool-description">
                  Français (France) - Changer la langue de l'interface
                </p>
                <button className="tool-btn">Modifier →</button>
              </div>

              <div className="tool-card" onClick={() => setActiveParam(activeParam === 'about' ? null : 'about')}>
                <div className="tool-icon">ℹ️</div>
                <h3 className="tool-title">À propos</h3>
                <p className="tool-description">
                  Version 1.0.0 - En savoir plus sur MyMír
                </p>
                <button className="tool-btn">Découvrir →</button>
              </div>
            </div>

            {activeParam && (
              <div className="result-card" style={{marginTop: '30px'}}>
                {renderParamContent(activeParam)}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;