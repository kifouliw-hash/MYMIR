import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Veuillez entrer votre adresse e-mail.');
      return;
    }

    setLoading(true);
    try {
      // À implémenter avec votre API
      setTimeout(() => {
        setMessage('Un email de réinitialisation a été envoyé à votre adresse.');
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError('Erreur lors de l\'envoi de l\'email.');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1>Mot de passe oublié</h1>
        <p style={{ color: '#94a3b8', marginBottom: '20px' }}>
          Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
        </p>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Adresse e-mail"
            required
            disabled={loading}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
        </form>

        <div className="links">
          <p><Link to="/login">← Retour à la connexion</Link></p>
          <p><Link to="/">Retour à l'accueil</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
