// === MyMír Server principal ===
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import siretRoute from "./backend/routes/siretRoute.js";

// === Configuration de base ===
const app = express();
app.use(cors());
app.use(express.json());

// === Résolution des chemins pour Render ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// === Routes API ===
app.use("/api/siret", siretRoute);

// === Route principale ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// === Lancement du serveur ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ MyMír Server lancé sur le port ${PORT}`));
// =======================================
// 🌐 server.js — Serveur MyMír avec Express
// =======================================

import express from 'express';
import bodyParser from 'body-parser';
import pool from './db.js'; // <-- on importe la connexion
import bcrypt from 'bcrypt';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(bodyParser.json());
const PORT = process.env.PORT || 3000;

// ==========================
// 🧱 Création de la table users
// ==========================
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);
  console.log("🧱 Table 'users' vérifiée/créée");
})();

// ==========================
// 📝 Inscription utilisateur
// ==========================
app.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name, email, hashed]
    );

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('❌ Erreur inscription:', err);
    res.status(400).json({ success: false, message: 'Erreur lors de l’inscription.' });
  }
});

// ==========================
// 🔐 Connexion utilisateur
// ==========================
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0)
      return res.status(400).json({ success: false, message: 'Utilisateur introuvable.' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);

    if (!valid)
      return res.status(400).json({ success: false, message: 'Mot de passe incorrect.' });

    res.json({ success: true, user });
  } catch (err) {
    console.error('❌ Erreur connexion:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
});

// ==========================
// 🚀 Lancement du serveur
// ==========================
app.listen(PORT, () => console.log(`✅ Serveur MyMír en ligne sur le port ${PORT}`));

