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

    // Particules
    const container = document.getElementById('particles');
    if (container && container.childNodes.length === 0) {
      for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.classList.add('particle');
        p.style.left = Math.random() * 100 + 'vw';
        p.style.bottom = Math.random() * -100 + 'vh';
        p.style.animationDuration = 8 + Math.random() * 12 + 's';
        p.style.animationDelay = Math.random() * -20 + 's';
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
      console.error('Erreur upload:', error);
      alert('❌ Erreur lors de l\'analyse');
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
      console.error('Erreur MAJ profil:', error);
      alert('❌ Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div id="halo1"></div>
      <div id="halo2"></div>
      <div id="particles"></div>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-circle">
            <span>M</span>
          </div>
          <h1>MyMír</h1>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {(profileData.companyName || profileData.name || 'U').charAt(0).toUpperCase()}
          </div>
          <p className="user-company">{profileData.companyName || profileData.name || 'Chargement...'}</p>
        </div>

        <nav className="nav-section">
          <button
            className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
            onClick={() => setActiveSection('home')}
          >
            <span className="nav-icon">🏠</span>
            <span>Accueil</span>
          </button>
          <button
            className={`nav-link ${activeSection === 'analyse' ? 'active' : ''}`}
            onClick={() => setActiveSection('analyse')}
          >
            <span className="nav-icon">📊</span>
            <span>Analyse</span>
          </button>
          <button
            className={`nav-link ${activeSection === 'aide' ? 'active' : ''}`}
            onClick={() => setActiveSection('aide')}
          >
            <span className="nav-icon">💡</span>
            <span>Aide</span>
          </button>
          <button
            className={`nav-link ${activeSection === 'historique' ? 'active' : ''}`}
            onClick={() => setActiveSection('historique')}
          >
            <span className="nav-icon">📜</span>
            <span>Historique</span>
          </button>
          <button
            className={`nav-link ${activeSection === 'profil' ? 'active' : ''}`}
            onClick={() => setActiveSection('profil')}
          >
            <span className="nav-icon">👤</span>
            <span>Profil</span>
          </button>
        </nav>

        <div className="logout-section">
          <button className="logout-btn" onClick={logout}>
            <span>🚪</span>
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="content">
        {/* ACCUEIL */}
        {activeSection === 'home' && (
          <section className="section active fade-in">
            <div className="welcome-card glass-card">
              <h1 className="welcome-title">
                Bienvenue {profileData.name} <span className="wave">👋</span>
              </h1>
              <p className="welcome-subtitle">
                Heureux de vous revoir sur MyMír. Prêt à optimiser vos appels d'offres ?
              </p>
              <button
                className="cta-button"
                onClick={() => setActiveSection('analyse')}
              >
                <span>Lancer une analyse</span>
                <span className="arrow">→</span>
              </button>
            </div>

            <div className="stats-grid">
              <div className="stat-card glass-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <h3>15</h3>
                  <p>Analyses effectuées</p>
                </div>
              </div>
              <div className="stat-card glass-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <h3>87%</h3>
                  <p>Taux de réussite</p>
                </div>
              </div>
              <div className="stat-card glass-card">
                <div className="stat-icon">⏱️</div>
                <div className="stat-content">
                  <h3>48h</h3>
                  <p>Gain de temps moyen</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ANALYSE */}
        {activeSection === 'analyse' && (
          <section className="section active fade-in">
            <h2 className="section-title">📊 Analyse de vos opportunités</h2>
            <p className="section-subtitle">
              Importez un DCE ou document d'appel d'offres — MyMír détecte les critères essentiels.
            </p>

            <div className="upload-zone glass-card">
              <div className="upload-icon">📁</div>
              <h3>Glissez votre dossier DCE ici</h3>
              <p>ou cliquez pour sélectionner</p>
              <input
                type="file"
                id="fileInput"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                hidden
              />
              <button
                className="upload-button"
                onClick={() => document.getElementById('fileInput').click()}
                disabled={uploadProgress}
              >
                {uploadProgress ? 'Analyse en cours...' : 'Choisir un fichier'}
              </button>
            </div>

            {uploadProgress && (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Analyse du dossier en cours...</p>
              </div>
            )}

            {analysisResult && (
              <div className="result-card glass-card">
                <h3>✅ Résultats de l'analyse</h3>
                <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
              </div>
            )}
          </section>
        )}

        {/* AIDE */}
        {activeSection === 'aide' && (
          <section className="section active fade-in">
            <h2 className="section-title">💡 Aide à la réponse</h2>
            <p className="section-subtitle">
              Optimisez vos documents de réponse grâce à nos recommandations.
            </p>

            <div className="cards-grid">
              <div className="help-card glass-card">
                <div className="card-icon">📝</div>
                <h3>Lettre de candidature</h3>
                <p>Modèle professionnel personnalisable selon votre entreprise.</p>
                <button className="secondary-btn">Générer →</button>
              </div>

              <div className="help-card glass-card">
                <div className="card-icon">🏗️</div>
                <h3>Description des moyens</h3>
                <p>Rédigez automatiquement vos moyens humains et matériels.</p>
                <button className="secondary-btn">Créer →</button>
              </div>

              <div className="help-card glass-card">
                <div className="card-icon">✅</div>
                <h3>Check-list finale</h3>
                <p>Vérifiez que votre dossier est complet avant dépôt.</p>
                <button className="secondary-btn">Voir →</button>
              </div>
            </div>
          </section>
        )}

        {/* HISTORIQUE */}
        {activeSection === 'historique' && (
          <section className="section active fade-in">
            <h2 className="section-title">📁 Historique de vos analyses</h2>
            
            <div className="table-container glass-card">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Nom du marché</th>
                    <th>Score</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>16/11/2025</td>
                    <td>Réhabilitation école communale</td>
                    <td><span className="badge badge-success">88%</span></td>
                    <td><span className="status status-done">Terminé</span></td>
                    <td>
                      <button className="icon-btn">📄</button>
                      <button className="icon-btn">📥</button>
                    </td>
                  </tr>
                  <tr>
                    <td>12/11/2025</td>
                    <td>Construction centre sportif</td>
                    <td><span className="badge badge-warning">72%</span></td>
                    <td><span className="status status-progress">En cours</span></td>
                    <td>
                      <button className="icon-btn">📄</button>
                      <button className="icon-btn">📥</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* PROFIL */}
        {activeSection === 'profil' && (
          <section className="section active fade-in">
            <div className="profile-header">
              <h2 className="section-title">👤 Profil de l'entreprise</h2>
              <button
                className="save-btn-header"
                onClick={handleProfileUpdate}
                disabled={loading}
              >
                {loading ? '⏳ Enregistrement...' : '💾 Enregistrer'}
              </button>
            </div>

            <form className="profile-form-grid glass-card" onSubmit={handleProfileUpdate}>
              <div className="form-column">
                <div className="form-group-modern">
                  <label>Entreprise</label>
                  <input
                    type="text"
                    value={profileData.companyName}
                    onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                    placeholder="Ex : Atelier BTP Côte d'Azur"
                  />
                </div>

                <div className="form-group-modern">
                  <label>Secteur</label>
                  <select
                    value={profileData.sector}
                    onChange={(e) => setProfileData({ ...profileData, sector: e.target.value })}
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

                <div className="form-group-modern">
                  <label>Effectif</label>
                  <select
                    value={profileData.effectif}
                    onChange={(e) => setProfileData({ ...profileData, effectif: e.target.value })}
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

                <div className="form-group-modern">
                  <label>Certifications</label>
                  <input
                    type="text"
                    value={profileData.certifications}
                    onChange={(e) => setProfileData({ ...profileData, certifications: e.target.value })}
                    placeholder="Ex : ISO 9001, Qualibat"
                  />
                </div>
              </div>

              <div className="form-column">
                <div className="form-group-modern">
                  <label>Pays</label>
                  <select
                    value={profileData.country}
                    onChange={(e) => setProfileData({ ...profileData, country: e.target.value })}
                  >
                    <option value="">Sélectionner</option>
                    <option value="France">France</option>
                    <option value="Belgique">Belgique</option>
                    <option value="Suisse">Suisse</option>
                    <option value="Luxembourg">Luxembourg</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Sous-secteur (optionnel)</label>
                  <input
                    type="text"
                    value={profileData.sousSecteur}
                    onChange={(e) => setProfileData({ ...profileData, sousSecteur: e.target.value })}
                    placeholder="Ex : Génie civil"
                  />
                </div>

                <div className="form-group-modern">
                  <label>Chiffre d'affaires annuel</label>
                  <select
                    value={profileData.revenue}
                    onChange={(e) => setProfileData({ ...profileData, revenue: e.target.value })}
                  >
                    <option value="">Sélectionner</option>
                    <option value="Moins de 100 000 €">{"< 100k €"}</option>
                    <option value="100 000 € - 500 000 €">100k - 500k €</option>
                    <option value="500 000 € - 1 M€">500k - 1M €</option>
                    <option value="1 M€ - 5 M€">1M - 5M €</option>
                    <option value="5 M€ - 10 M€">5M - 10M €</option>
                    <option value="Plus de 10 M€">{"> 10M €"}</option>
                  </select>
                </div>

                <div className="form-group-modern">
                  <label>Site web / LinkedIn</label>
                  <input
                    type="url"
                    value={profileData.siteWeb}
                    onChange={(e) => setProfileData({ ...profileData, siteWeb: e.target.value })}
                    placeholder="https://votre-site.com"
                  />
                </div>
              </div>

              <div className="form-group-modern full-width">
                <label>Description de l'entreprise</label>
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