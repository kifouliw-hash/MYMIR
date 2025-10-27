// ==========================================
// 🧠 db-check.js — Vérifie la table users PostgreSQL
// ==========================================
import pool from './db.js';

(async () => {
  try {
    console.log("🔍 Connexion à la base...");
    const res = await pool.query("SELECT * FROM users;");
    console.log("✅ Utilisateurs trouvés :", res.rows);
  } catch (err) {
    if (err.message.includes("relation")) {
      console.log("⚠️ Table 'users' inexistante, création en cours...");
      await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL
        );
      `);
      console.log("✅ Table 'users' créée avec succès !");
    } else {
      console.error("❌ Erreur :", err);
    }
  } finally {
    process.exit();
  }
})();
