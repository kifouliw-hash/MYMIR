import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, analysisAPI } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('home');
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
    }

    // Générer les particules
    const container = document.getElementById('particles');
    if (container) {
      for (let i = 0; i < 45; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.style.left = Math.random() * 100 + 'vw';
        p.style.bottom = Math.random() * -100 + 'vh';
        p.style.animationDuration = 8 + Math.random() * 12 + 's';
        p.style.animationDelay = Math.random() * -20 + 's';
        p.style.opacity = 0.3 + Math.random() * 0.5;
        container.appendChild(p);
      }
    }
  }, [user]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadProgress(true);
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await analysisAPI.uploadDocument(formData);
      setAnalysisResult(response.data);
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'analyse du document');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
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

      await userAPI.updateProfile(dataToSend);
      alert('✅ Profil mis à jour avec succès !');
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('❌ Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div id="halo1"></div>
      <div id="halo2"></div>
      <div id="particles"></div>

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-circle">
            <span style={{ fontSize: '24px' }}>M</span>
          </div>
          <h1>MyMír</h1>
        </div>

        <div className="user-info">
          <p id="companyName">{profileData.companyName || profileData.name || 'Chargement...'}</p>
        </div>

        <div className="nav-section">
          <button
            className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => setActiveSection('home')}
          >
            🏠 Accueil
          </button>
          <button
            className={`nav-link ${activeSection === 'analyse' ? 'active' : ''}`}
            onClick={() => setActiveSection('analyse')}
          >
            📊 Analyse
          </button>
          <button
            className={`nav-link ${activeSection === 'aide' ? 'active' : ''}`}
            onClick={() => setActiveSection('aide')}
          >
            💡 Aide à la réponse
          </button>
          <button
            className={`nav-link ${activeSection === 'historique' ? 'active' : ''}`}
            onClick={() => setActiveSection('historique')}
          >
            📜 Historique
          </button>
          <button
            className={`nav-link ${activeSection === 'profil' ? 'active' : ''}`}
            onClick={() => setActiveSection('profil')}
          >
            👤 Profil
          </button>
        </div>

        <div className="logout-section">
          <button className="logout-btn" onClick={logout}>
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="content">
        {/* Section Accueil */}
        {activeSection === 'home' && (
          <section id="home" className="section active">
            <div className="welcome-card">
              <h1>Bienvenue {profileData.name} <span style={{ color: '#facc15' }}>👋</span></h1>
              <p>
                Heureux de vous revoir sur MyMír, vous êtes prêt à optimiser vos appels d'offres ?
              </p>
              <button
                className="welcome-btn"
                onClick={() => setActiveSection('analyse')}
              >
                Lancer une analyse
              </button>
            </div>
          </section>
        )}

        {/* Section Analyse */}
        {activeSection === 'analyse' && (
          <section id="analyse" className="section active">
            <h2>📊 Analyse de vos opportunités</h2>
            <p style={{ color: '#94a3b8', marginBottom: '25px' }}>
              Importez un DCE ou document d'appel d'offres — MyMír détecte les critères essentiels
              et vous guide dans votre réponse.
            </p>

            <div className="upload-area">
              <p>Glissez votre dossier DCE ici ou cliquez pour le sélectionner.</p>
              <input
                type="file"
                id="fileInput"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                hidden
              />
              <button
                className="analysis-btn"
                onClick={() => document.getElementById('fileInput').click()}
              >
                Choisir un fichier
              </button>
            </div>

            {uploadProgress && (
              <div className="loading">
                <div className="spinner"></div>
                <p>Analyse du dossier en cours...</p>
              </div>
            )}

            {analysisResult && (
              <div className="result-area">
                <h3>Résultats de l'analyse</h3>
                <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
              </div>
            )}
          </section>
        )}

        {/* Section Aide */}
        {activeSection === 'aide' && (
          <section id="aide" className="section active">
            <h2>💡 Aide à la réponse</h2>
            <p style={{ color: '#94a3b8', marginBottom: '25px' }}>
              Optimisez vos documents de réponse grâce à nos recommandations expertes.
            </p>

            <div className="cards">
              <div className="help-card">
                <h3>📝 Lettre de candidature</h3>
                <p>Modèle de lettre professionnelle et personnalisable selon votre entreprise.</p>
                <button className="secondary-btn">Générer un modèle</button>
              </div>

              <div className="help-card">
                <h3>🏗️ Description des moyens</h3>
                <p>Rédigez automatiquement la partie sur vos moyens humains et matériels.</p>
                <button className="secondary-btn">Créer un descriptif</button>
              </div>

              <div className="help-card">
                <h3>✅ Check-list finale</h3>
                <p>Vérifiez que votre dossier est complet avant le dépôt.</p>
                <button className="secondary-btn">Voir la check-list</button>
              </div>
            </div>
          </section>
        )}

        {/* Section Historique */}
        {activeSection === 'historique' && (
          <section id="historique" className="section active">
            <h2>📁 Historique de vos analyses</h2>
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Nom du marché</th>
                  <th>Score</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>10/10/2025</td>
                  <td>Réhabilitation école communale</td>
                  <td>88%</td>
                  <td>Terminé</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* Section Profil */}
        {activeSection === 'profil' && (
          <section id="profil" className="section active">
            <div className="profile-header">
              <h2>👤 Profil de l'entreprise</h2>
              <button
                className="save-btn-header"
                onClick={handleProfileUpdate}
                disabled={loading}
              >
                💾 {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>

            <form className="profile-form-grid" onSubmit={handleProfileUpdate}>
              {/* Colonne gauche */}
              <div className="form-column">
                <div className="form-group-modern">
                  <label>Entreprise :</label>
                  <input
                    type="text"
                    value={profileData.companyName}
                    onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                    placeholder="Ex : Atelier BTP Côte d'Azur"
                  />
                </div>

                <div className="form-group-modern">
                  <label>Secteur :</label>
                  <select
                    value={profileData.sector}
                    onChange={(e) => setProfileData({ ...profileData, sector: e.target.value })}
                  >
                    <option value="">Sélectionner un secteur</option>
                    <option value="BTP / Construction">BTP / Construction</option>
                    <option value="Conseil / Ingénierie">Conseil / Ingénierie</option>
                    <option value="Informatique / Numérique">Informatique / Numérique</option>
                    <option value="Services aux entreprises">Services aux entreprises</option>
                    <option value="Santé / Social">Santé / Social</option>
                    <option value="Transport / Logistique">Transport / Logistique</option>
                    <option value="Environnement / Énergie">Environnement / Énergie</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Effectif :</label>
                  <select
                    value={profileData.effectif}
                    onChange={(e) => setProfileData({ ...profileData, effectif: e.target.value })}
                  >
                    <option value="">Sélectionner</option>
                    <option value="1">1 (auto-entrepreneur)</option>
                    <option value="2-5">2-5</option>
                    <option value="6-20">6-20</option>
                    <option value="21-50">21-50</option>
                    <option value="51-100">51-100</option>
                    <option value="100+">100+</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Certifications :</label>
                  <input
                    type="text"
                    value={profileData.certifications}
                    onChange={(e) => setProfileData({ ...profileData, certifications: e.target.value })}
                    placeholder="Ex : ISO 9001, Qualibat"
                  />
                </div>
              </div>

              {/* Colonne droite */}
              <div className="form-column">
                <div className="form-group-modern">
                  <label>Pays :</label>
                  <select
                    value={profileData.country}
                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                  >
                    <option value="">Sélectionner un pays</option>
                    <option value="France">France</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Luxembourg">Luxembourg</option>
                    <option value="Canada">Canada</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Sous-secteur (optionnel) :</label>
                  <input
                    type="text"
                    value={profileData.sousSecteur}
                    onChange={(e) => setProfileData({ ...profileData, sousSecteur: e.target.value })}
                    placeholder="Ex : Génie civil, Électricité..."
                  />
                </div>

                <div className="form-group-modern">
                  <label>Chiffre d'affaires annuel :</label>
                  <select
                    value={profileData.revenue}
                    onChange={(e) => setProfileData({ ...profileData, revenue: e.target.value })}
                  >
                    <option value="">Sélectionner</option>
                    <option value="Moins de 100 000 €">Moins de 100 000 €</option>
                    <option value="100 000 € - 500 000 €">100 000 € - 500 000 €</option>
                    <option value="500 000 € - 1 M€">500 000 € - 1 M€</option>
                    <option value="1 M€ - 5 M€">1 M€ - 5 M€</option>
                    <option value="5 M€ - 10 M€">5 M€ - 10 M€</option>
                    <option value="Plus de 10 M€">Plus de 10 M€</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Site web / LinkedIn :</label>
                  <input
                    type="url"
                    value={profileData.siteWeb}
                    onChange={(e) => setProfileData({ ...profileData, siteWeb: e.target.value })}
                    placeholder="https://votre-site.com"
                  />
                </div>
              </div>

              {/* Description pleine largeur */}
              <div className="form-group-modern full-width">
                <label>Description de l'entreprise (optionnel) :</label>
                <textarea
                  rows="4"
                  value={profileData.description}
                  onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                  placeholder="Présentez brièvement votre activité..."
                />
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;