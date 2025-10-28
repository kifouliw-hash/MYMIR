import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pg from "pg";

const router = express.Router();
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// === INSCRIPTION ===
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "Champs manquants." });
  }

  try {
    const existing = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Cet email est déjà utilisé." });
    }

    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1,$2,$3)",
      [name, email, hash]
    );

    res.status(201).json({ message: "Utilisateur créé avec succès." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// === CONNEXION ===
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Utilisateur introuvable." });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({ message: "Connexion réussie", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur." });
  }
});

// === DÉCONNEXION ===
router.post("/logout", (req, res) => {
  res.json({ message: "Déconnexion réussie." });
});

export default router;
