import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Admin.css';

const Admin = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAnalyses: 0,
    activeToday: 0
  });

  useEffect(() => {
    // À implémenter avec votre API
    // Charger les statistiques et les utilisateurs
  }, []);

  return (
    <div className="admin-page">
      <header className="admin-header">
        <h1>Administration MyMír</h1>
        <button onClick={logout} className="logout-btn">Déconnexion</button>
      </header>

      <div className="admin-content">
        <section className="stats-section">
          <div className="stat-card">
            <h3>Utilisateurs totaux</h3>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h3>Analyses effectuées</h3>
            <p className="stat-number">{stats.totalAnalyses}</p>
          </div>
          <div className="stat-card">
            <h3>Actifs aujourd'hui</h3>
            <p className="stat-number">{stats.activeToday}</p>
          </div>
        </section>

        <section className="users-section">
          <h2>Liste des utilisateurs</h2>
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Entreprise</th>
                <th>Email</th>
                <th>Date d'inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    Aucun utilisateur trouvé
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.companyName}</td>
                    <td>{user.email}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="action-btn">Voir</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default Admin;
