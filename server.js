// =======================================
// 🌐 server.js — Serveur MyMír avec Express + PostgreSQL
// =======================================

import express from "express";
import bodyParser from "body-parser";
import pool from "./db.js";
import bcrypt from "bcrypt";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// === Setup paths (utile sur Render)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === Middleware
app.use(cors());
app.use(bodyParser.json());

// === Servir le frontend (ton dossier public/)
app.use(express.static(path.join(__dirname, "public")));

// =======================================
// 🔧 Vérification & (Re)création de la table "users"
// =======================================
(async () => {
  try {
    await pool.query(`
      DROP TABLE IF EXISTS users CASCADE;
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("🧱 Table 'users' recréée proprement ✅");
  } catch (err) {
    console.error("⚠️ Erreur lors de la création de la table users:", err);
  }
})();


// ==========================
// 📝 Route d’inscription complète MyMír
// ==========================
app.post("/register", async (req, res) => {
  try {
    const {
      companyName,
      managerName,
      email,
      sector,
      revenue,
      employees,
      country,
      certifications,
      password
    } = req.body;

    if (!email || !password || !companyName || !managerName)
      return res.status(400).json({ success: false, message: "Champs obligatoires manquants." });

    const hashed = await bcrypt.hash(password, 10);

    // Vérifie/Crée la table complète si besoin
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ajoute l'utilisateur avec ses métadonnées
    const result = await pool.query(
      `INSERT INTO users (name, email, password, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, metadata;`,
      [
        managerName,
        email,
        hashed,
        {
          companyName,
          sector,
          revenue,
          employees,
          country,
          certifications,
        },
      ]
    );

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("❌ Erreur inscription:", err);
    res.status(400).json({ success: false, message: "Erreur lors de l’inscription." });
  }
});

// ==========================
// 🔐 Route de connexion
// ==========================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ success: false, message: "Utilisateur introuvable." });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(400).json({ success: false, message: "Mot de passe incorrect." });

    // ✅ Retourne aussi les métadonnées de l'utilisateur
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        metadata: user.metadata || {}
      }
    });
  } catch (err) {
    console.error("❌ Erreur connexion:", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});
// ==========================
// ❌ Suppression d’un utilisateur (admin)
// ==========================
app.delete("/users/:id", async (req, res) => {
  try {
    const adminKey = req.query.key;
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ success: false, message: "Accès non autorisé" });
    }

    const userId = req.params.id;
    const result = await pool.query("DELETE FROM users WHERE id = $1 RETURNING id, email;", [userId]);

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable." });
    }

    res.json({
      success: true,
      message: `Utilisateur supprimé (${result.rows[0].email})`
    });
  } catch (err) {
    console.error("❌ Erreur suppression:", err);
    res.status(500).json({ success: false, message: "Erreur serveur lors de la suppression." });
  }
});

// ==========================
// 👁️ Route admin : liste des utilisateurs
// ==========================
app.get("/users", async (req, res) => {
  try {
    // Clé d’accès simple (à améliorer plus tard)
    const adminKey = req.query.key;
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({ success: false, message: "Accès non autorisé" });
    }

    const result = await pool.query(
      "SELECT id, name, email, metadata, created_at FROM users ORDER BY id DESC;"
    );
    res.json({ success: true, count: result.rows.length, users: result.rows });
  } catch (err) {
    console.error("❌ Erreur /users:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
});

// ==========================
// 🌍 Route fallback — renvoyer ton index.html
// ==========================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
// =======================================
// 🔧 Vérification & mise à jour de la table "users"
// =======================================
(async () => {
  try {
    // Crée la table si elle n'existe pas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Ajoute la colonne "name" si manquante
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS name TEXT;
    `);

    // Ajoute la colonne "metadata" si manquante
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
    `);

    console.log("🧱 Table 'users' vérifiée et à jour ✅");
  } catch (err) {
    console.error("⚠️ Erreur vérification table users:", err);
  }
})();

// ==========================
// 🚀 Lancement du serveur
// ==========================
app.listen(PORT, () =>
  console.log(`✅ Serveur MyMír en ligne sur le port ${PORT}`)
);
