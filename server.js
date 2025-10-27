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

// ==========================
// 🧱 Création table utilisateurs (avec métadonnées JSON)
// ==========================
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'  -- ✅ nouvelles données entreprise
      );
    `);
    console.log("🧱 Table 'users' prête ✅");
  } catch (err) {
    console.error("❌ Erreur création table users:", err);
  }
})();

// ==========================
// 📝 Route d’inscription (enregistrement complet)
// ==========================
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, metadata } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Champs manquants." });
    }

    const hashed = await bcrypt.hash(password, 10);

    // ✅ Insertion avec métadonnées JSON
    const result = await pool.query(
      `INSERT INTO users (name, email, password, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, metadata`,
      [name, email, hashed, metadata || {}]
    );

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("❌ Erreur inscription:", err);

    // Gestion du cas email déjà existant
    if (err.message.includes("duplicate key value")) {
      return res
        .status(400)
        .json({ success: false, message: "Un compte existe déjà avec cet e-mail." });
    }

    res
      .status(400)
      .json({ success: false, message: "Erreur lors de l’inscription." });
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
// 🌍 Route fallback — renvoyer ton index.html
// ==========================
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ==========================
// 🚀 Lancement du serveur
// ==========================
app.listen(PORT, () =>
  console.log(`✅ Serveur MyMír en ligne sur le port ${PORT}`)
);
