import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  return (
    <div className="home-page">
      <header className="navbar">
        <div className="nav-left">
          <img src="/assets/logo/favicon.ico" alt="Logo MyMír" className="logo" />
          <span className="brand">MyMír</span>
        </div>
        <nav className="nav-links">
          <Link to="/">Accueil</Link>
          <a href="#analyse">Analyse</a>
          <a href="#aide">Aide</a>
          <Link to="/app">Application</Link>
          <Link to="/login" className="login-btn">Connexion</Link>
        </nav>
      </header>

      <section className="hero">
        <h1>Guidez vos décisions avec MyMír.</h1>
        <p>L'intelligence stratégique pour vos appels d'offres et décisions d'entreprise.</p>
        <Link to="/app" className="cta">Commencer l'analyse</Link>
      </section>

      <footer>
        <p>© 2025 MyMír — Tous droits réservés.</p>
      </footer>
    </div>
  );
};

export default Home;
