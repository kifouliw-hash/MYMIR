import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    managerName: '',
    email: '',
    sector: '',
    sectorOther: '',
    employees: '',
    country: '',
    countryOther: '',
    certifications: '',
    revenue: '',
    description: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSectorOther, setShowSectorOther] = useState(false);
  const [showCountryOther, setShowCountryOther] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));

    if (id === 'sector') setShowSectorOther(value === 'Autre (à préciser)');
    if (id === 'country') setShowCountryOther(value === 'Autre (à préciser)');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.companyName || !formData.email || !formData.password) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);
    try {
      const userData = {
        ...formData,
        sector: formData.sector === 'Autre (à préciser)' ? formData.sectorOther : formData.sector,
        country: formData.country === 'Autre (à préciser)' ? formData.countryOther : formData.country,
      };

      const result = await register(userData);
      if (result.success) {
        setSuccess(result.message);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(result.message || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError('Impossible de se connecter au serveur.');
    } finally {
      setLoading(false);
    }
  };

  /* LISTES DÉROULANTES */
  const sectors = [
    'BTP / Travaux publics', 'Architecture / Ingénierie', 'Électricité / Éclairage public',
    'Plomberie / Chauffage / Climatisation', 'Peinture / Finitions', 'Menuiserie / Serrurerie',
    'Nettoyage / Hygiène', 'Maintenance industrielle', 'Informatique / Développement logiciel',
    'Cybersécurité', 'Télécom / Réseaux', 'Énergie / Environnement', 'Déchets / Recyclage',
    'Transport / Logistique', 'Location de véhicules / Matériel', 'Commerce / Distribution',
    'Fournitures de bureau', 'Mobilier / Aménagement', 'Événementiel / Communication',
    'Marketing / Publicité', 'Conseil / Audit', 'Formation professionnelle',
    'Ressources humaines / Intérim', 'Santé / Médical', 'Pharmaceutique', 'Agroalimentaire',
    'Agriculture', 'Industrie', 'Chimie / Plasturgie', 'Métallurgie', 'Bureau d\'études',
    'Travaux maritimes / fluviaux', 'Assurances / Finances', 'Immobilier / Promotion',
    'Services juridiques', 'Entretien des espaces verts', 'Travaux routiers',
    'Travaux ferroviaires', 'Défense / Sécurité', 'Collecte / Assainissement',
    'Fournitures scolaires', 'Transport scolaire', 'Travaux d\'étanchéité / Toiture',
    'Autre (à préciser)'
  ];

  const countries = [
    'France', 'Belgique', 'Luxembourg', 'Suisse', 'Canada', 'Côte d\'Ivoire', 'Sénégal',
    'Mali', 'Maroc', 'Algérie', 'Tunisie', 'Burkina Faso', 'Niger', 'Cameroun', 'Bénin',
    'Togo', 'RDC', 'Afrique du Sud', 'Royaume-Uni', 'États-Unis', 'Allemagne', 'Italie',
    'Espagne', 'Portugal', 'Pays-Bas', 'Autriche', 'Suède', 'Norvège', 'Finlande', 'Grèce',
    'Turquie', 'Chine', 'Inde', 'Japon', 'Corée du Sud', 'Brésil', 'Mexique',
    'Émirats arabes unis', 'Arabie Saoudite', 'Autre (à préciser)'
  ];

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-box">

          {/* TITRE CENTRÉ + SOUFFLE VISUEL */}
          <div className="register-header">
            <h1>Créer un compte <span>MyMír</span></h1>
            <p className="subtitle">
              ✨ En moins d'une minute, démarrez avec <strong>MyMír</strong> et optimisez vos appels d'offres.
            </p>
          </div>

          {/* Messages d'erreur */}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* FORMULAIRE */}
          <form onSubmit={handleSubmit}>

            {/* Identité entreprise */}
            <div className="row">
              <div>
                <label>Nom de l'entreprise</label>
                <input
                  type="text"
                  id="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Ex : Atelier BTP Côte d'Azur"
                  required
                />
              </div>

              <div>
                <label>Nom du responsable</label>
                <input
                  type="text"
                  id="managerName"
                  value={formData.managerName}
                  onChange={handleChange}
                  placeholder="Ex : Jean Dupont"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <label>Email professionnel</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Ex : contact@entreprise.com"
              required
            />

            {/* Secteur + Effectif */}
            <div className="row">
              <div>
                <label>Secteur d'activité</label>
                <select id="sector" value={formData.sector} onChange={handleChange} required>
                  <option value="">Sélectionner un secteur</option>
                  {sectors.map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                {showSectorOther && (
                  <input
                    type="text"
                    id="sectorOther"
                    value={formData.sectorOther}
                    onChange={handleChange}
                    placeholder="Précisez votre secteur..."
                  />
                )}
              </div>

              <div>
                <label>Effectif</label>
                <select id="employees" value={formData.employees} onChange={handleChange} required>
                  <option value="">Sélectionner</option>
                  <option>1–5</option>
                  <option>6–20</option>
                  <option>21–50</option>
                  <option>51–100</option>
                  <option>+100</option>
                </select>
              </div>
            </div>

            {/* Pays + Certifications */}
            <div className="row">
              <div>
                <label>Pays / région principale</label>
                <select id="country" value={formData.country} onChange={handleChange} required>
                  <option value="">Sélectionner un pays</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>

                {showCountryOther && (
                  <input
                    type="text"
                    id="countryOther"
                    value={formData.countryOther}
                    onChange={handleChange}
                    placeholder="Précisez votre pays..."
                  />
                )}
              </div>

              <div>
                <label>Certifications (optionnel)</label>
                <input
                  type="text"
                  id="certifications"
                  value={formData.certifications}
                  onChange={handleChange}
                  placeholder="Ex : ISO 9001, Qualibat..."
                />
              </div>
            </div>

            {/* CA */}
            <label>Chiffre d'affaires annuel</label>
            <select id="revenue" value={formData.revenue} onChange={handleChange} required>
              <option value="">Sélectionner</option>
              <option>Moins de 100 000 €</option>
              <option>100 000 € – 500 000 €</option>
              <option>500 000 € – 2 000 000 €</option>
              <option>2 000 000 € – 10 000 000 €</option>
              <option>Plus de 10 000 000 €</option>
            </select>

            {/* Description */}
            <label>Description de l'entreprise (optionnel)</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Présentez brièvement votre activité..."
            ></textarea>

            {/* Mot de passe */}
            <label>Mot de passe</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            {/* Bouton */}
            <button type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer le compte'}
            </button>
          </form>

          {/* Footer */}
          <p className="footer">
            Déjà un compte ? <Link to="/login">Se connecter</Link><br />
            <Link to="/">← Retour à l'accueil</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
