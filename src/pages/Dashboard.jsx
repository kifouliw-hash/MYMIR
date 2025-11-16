import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, analysisAPI } from '../services/api';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState('home');
  const [profileData, setProfileData] = useState(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    if (user) {
      setProfileData(user);
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

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      await userAPI.updateProfile(profileData);
      alert('Profil mis à jour avec succès !');
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour du profil');
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
          <img src="/assets/logo/logo-mymir.png" alt="Logo MyMír" className="logo" />
          <h1>MyMír</h1>
        </div>

        <div className="user-info">
          <p id="companyName">{user?.companyName || 'Chargement...'}</p>
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
              <h1>Bienvenue <span style={{ color: '#facc15' }}>👋</span></h1>
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
          <section id="analyse" className="section">
            <h2>📊 Analyse de vos opportunités</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '25px' }}>
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
          <section id="aide" className="section">
            <h2>💡 Aide à la réponse</h2>
            <p>Optimisez vos documents de réponse grâce à nos recommandations expertes.</p>

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
          <section id="historique" className="section">
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
          <section id="profil" className="section">
            <h2>👤 Profil de l'entreprise</h2>

            {!isEditingProfile && (
              <>
                <button
                  className="edit-btn"
                  onClick={() => setIsEditingProfile(true)}
                >
                  ✏️ Modifier le profil
                </button>

                <div className="profile-card">
                  <p><strong>Entreprise :</strong> {profileData?.companyName || '—'}</p>
                  <p><strong>Email :</strong> {profileData?.email || '—'}</p>
                  <p><strong>Pays :</strong> {profileData?.country || '—'}</p>
                  <p><strong>Secteur :</strong> {profileData?.sector || '—'}</p>
                  <p><strong>Effectif :</strong> {profileData?.employees || '—'}</p>
                  <p><strong>Chiffre d'affaires :</strong> {profileData?.revenue || '—'}</p>
                  <p><strong>Certifications :</strong> {profileData?.certifications || '—'}</p>
                  <p><strong>Description :</strong> {profileData?.description || '—'}</p>
                </div>
              </>
            )}

            {isEditingProfile && profileData && (
              <>
                <button
                  className="save-btn"
                  onClick={handleProfileUpdate}
                  disabled={loading}
                >
                  💾 {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
                <button
                  className="cancel-btn"
                  onClick={() => setIsEditingProfile(false)}
                  style={{ marginLeft: '10px' }}
                >
                  Annuler
                </button>

                <form className="profile-form">
                  <div className="form-group">
                    <label>Entreprise :</label>
                    <input
                      type="text"
                      value={profileData.companyName || ''}
                      onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Pays :</label>
                    <input
                      type="text"
                      value={profileData.country || ''}
                      onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Secteur :</label>
                    <input
                      type="text"
                      value={profileData.sector || ''}
                      onChange={(e) => setProfileData({ ...profileData, sector: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Description :</label>
                    <textarea
                      rows="3"
                      value={profileData.description || ''}
                      onChange={(e) => setProfileData({ ...profileData, description: e.target.value })}
                    />
                  </div>
                </form>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
