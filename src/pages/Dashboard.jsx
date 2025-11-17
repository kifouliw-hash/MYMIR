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
          <h3>Support technique</h3>
          <p>Email : support@mymir.com</p>
          <p>Téléphone : +33 1 23 45 67 89</p>
          <p>Disponible 24/7</p>
        </div>
      ),
      legal: (
        <div className="param-content">
          <h3>Mentions légales</h3>
          <p>MyMír SAS - Capital social : 50 000 €</p>
          <p>SIRET : 123 456 789 00012</p>
          <p>Siège social : 123 rue de la Tech, 75001 Paris</p>
        </div>
      ),
      privacy: (
        <div className="param-content">
          <h3>Confidentialité</h3>
          <p>Vos données sont cryptées et sécurisées.</p>
          <p>Nous ne partageons jamais vos informations.</p>
          <p>Conformité RGPD garantie.</p>
        </div>
      ),
      terms: (
        <div className="param-content">
          <h3>CGU & CGV</h3>
          <p>Conditions générales d'utilisation</p>
          <p>Conditions générales de vente</p>
          <p>Dernière mise à jour : 17/11/2025</p>
        </div>
      ),
      language: (
        <div className="param-content">
          <h3>Langue</h3>
          <select className="field-input">
            <option>Français (France)</option>
            <option>English (US)</option>
            <option>Español</option>
          </select>
        </div>
      ),
      about: (
        <div className="param-content">
          <h3>À propos de MyMír</h3>
          <p>Version 1.0.0</p>
          <p>© 2025 MyMír - Tous droits réservés</p>
          <p>Plateforme d'analyse d'appels d'offres par IA</p>
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