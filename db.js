// ===============================
// 📦 db.js — Connexion PostgreSQL
// ===============================

import pkg from 'pg';
const { Pool } = pkg;

// Connexion à la base Render via la variable d'environnement
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log("✅ Connecté à PostgreSQL"))
  .catch(err => console.error("❌ Erreur de connexion PostgreSQL:", err));

export default pool;
