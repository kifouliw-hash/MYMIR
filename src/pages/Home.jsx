import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  const [menuActive, setMenuActive] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Gérer le scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Empêcher le scroll quand le menu est ouvert
  useEffect(() => {
    if (menuActive) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [menuActive]);

  const toggleMenu = () => {
    setMenuActive(!menuActive);
  };

  const closeMenu = () => {
    setMenuActive(false);
  };

  return (
    <div className="home-page">
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${menuActive ? 'active' : ''}`}
        onClick={closeMenu}
      ></div>

      {/* NAVBAR */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-left">
          <div className="logo">M</div>
          <span className="brand">MyMír</span>
        </div>

        <div className={`nav-links ${menuActive ? 'active' : ''}`}>
          <a href="#accueil" onClick={closeMenu}>Accueil</a>
          <a href="#fonctionnalites" onClick={closeMenu}>Fonctionnalités</a>
          <a href="#tarifs" onClick={closeMenu}>Tarifs</a>
          <a href="#contact" onClick={closeMenu}>Contact</a>
          <Link to="/login" className="login-btn" onClick={closeMenu}>
            Connexion
          </Link>
        </div>

        <div 
          className={`burger ${menuActive ? 'active' : ''}`}
          onClick={toggleMenu}
        >
          <div className="burger-line"></div>
          <div className="burger-line"></div>
          <div className="burger-line"></div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="hero" id="accueil">
        <div className="hero-content">
          <h1>
            Optimisez vos <span>appels d'offres</span> avec l'IA
          </h1>
          <p>
            MyMír analyse vos DCE en quelques secondes et vous guide pour maximiser 
            vos chances de succès. Gagnez du temps, augmentez votre taux de réussite.
          </p>
          <div className="hero-actions">
            <Link to="/register" className="cta">
              <span>Commencer gratuitement</span>
              <span className="cta-arrow">→</span>
            </Link>
            <a href="#fonctionnalites" className="cta-secondary">
              <span>En savoir plus</span>
            </a>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features" id="fonctionnalites">
        <div className="hero-content">
          <h2 style={{ 
            fontSize: 'clamp(2rem, 4vw, 3rem)', 
            fontWeight: '800',
            color: '#f1f5f9',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            Pourquoi choisir MyMír ?
          </h2>
          <p style={{ 
            fontSize: '18px', 
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '700px',
            margin: '0 auto'
          }}>
            Des outils intelligents pour transformer votre processus de réponse aux appels d'offres
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <span className="feature-icon">🤖</span>
            <h3>Analyse IA instantanée</h3>
            <p>
              Notre intelligence artificielle analyse vos DCE en quelques secondes 
              et identifie automatiquement les critères essentiels.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Scoring automatique</h3>
            <p>
              Obtenez un score de pertinence pour chaque opportunité et priorisez 
              les appels d'offres les plus adaptés à votre profil.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">✍️</span>
            <h3>Aide à la rédaction</h3>
            <p>
              Générez des templates personnalisés pour vos lettres de candidature 
              et descriptions de moyens techniques.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">📈</span>
            <h3>Suivi & Historique</h3>
            <p>
              Gardez une trace de toutes vos analyses et suivez vos performances 
              au fil du temps avec des statistiques détaillées.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">🔒</span>
            <h3>Sécurité & Confidentialité</h3>
            <p>
              Vos données sont chiffrées et sécurisées. Nous ne partageons jamais 
              vos informations avec des tiers.
            </p>
          </div>

          <div className="feature-card">
            <span className="feature-icon">⚡</span>
            <h3>Gain de temps</h3>
            <p>
              Réduisez de 70% le temps consacré à l'analyse des DCE et concentrez-vous 
              sur la qualité de votre réponse.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-content">
          <div className="footer-logo">
            <div className="logo">M</div>
            <span className="brand">MyMír</span>
          </div>
          <div className="footer-links">
            <a href="#accueil">Accueil</a>
            <a href="#fonctionnalites">Fonctionnalités</a>
            <a href="#tarifs">Tarifs</a>
            <a href="#contact">Contact</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 MyMír. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;