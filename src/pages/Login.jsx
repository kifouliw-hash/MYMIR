import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) navigate('/app');
      else setError(result.message || 'Identifiants incorrects ou compte non trouvé.');
    } catch (err) {
      setError('Impossible de se connecter au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">

      {/* ===== LOGO + TITRE ===== */}
      <div className="login-logo">
        <div className="login-logo-circle">M</div>
        <h1 className="login-title">Connexion MyMír</h1>
        <p className="login-subtitle">Ravi de vous revoir 👋</p>
      </div>

      {/* ===== CARD ===== */}
      <div className="login-container">
        <div className="login-card">

          {error && <div className="error-message">{error}</div>}

          <form className="login-form" onSubmit={handleSubmit}>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">Adresse e-mail</label>
              <input
                type="email"
                className="form-input"
                placeholder="exemple@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Mot de passe */}
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <input
                type="password"
                className="form-input"
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            {/* Bouton */}
            <button className="submit-btn" type="submit" disabled={loading}>
              <span>{loading ? 'Connexion…' : 'Se connecter'}</span>
            </button>
          </form>

          {/* Liens */}
          <div className="forgot-password">
            <Link to="/forgot">Mot de passe oublié ?</Link>
          </div>

          <div className="signup-link">
            Pas encore de compte ? <Link to="/register">Créer un compte</Link>
          </div>

          <div className="back-link">
            <Link to="/">← Retour à l'accueil</Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;
