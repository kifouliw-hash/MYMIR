import express from "express";
import bodyParser from "body-parser";
import pool from "./db.js";
import bcrypt from "bcrypt";
import cors from "cors";
import path from "path";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import siretRoutes from "./backend/routes/siretRoute.js";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/siret", siretRoutes); 


// ✅ Vérifie la table users au démarrage
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("🧱 Table 'users' vérifiée et prête ✅");
  } catch (err) {
    console.error("⚠️ Erreur vérification table users:", err);
  }
})();

// ============================
// 🚀 INSCRIPTION (version finale)
// ============================
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
      password,
    } = req.body;

    if (!email || !password || !companyName || !managerName)
      return res.status(400).json({ success: false, message: "Champs obligatoires manquants." });

    // Vérifie si l’utilisateur existe déjà
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: "Cet email est déjà enregistré." });
    }

    // Hash du mot de passe
    const hashed = await bcrypt.hash(password, 10);

    // Insertion dans la table
const result = await pool.query(
  `INSERT INTO users (name, email, password, metadata)
   VALUES ($1, $2, $3, $4)
   RETURNING id, name, email, metadata;`,
  [
    managerName,
    email,
    hashed,
    JSON.stringify({ companyName, sector, revenue, employees, country, certifications }),
  ]
);

// ✅ Crée un token immédiatement après inscription
const user = result.rows[0];
const token = jwt.sign(
  { id: user.id, email: user.email },
  process.env.JWT_SECRET || "fallbackSecret",
  { expiresIn: "2h" }
);

console.log("✅ Nouveau compte créé et connecté :", email);

res.status(200).json({
  success: true,
  message: "Compte créé avec succès et connecté",
  token,
  user,
});

// ============================
// 🔐 CONNEXION
// ============================
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifie si l’utilisateur existe
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Utilisateur introuvable." });
    }

    const user = result.rows[0];

    // Vérifie le mot de passe
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ success: false, message: "Mot de passe incorrect." });
    }

    // ✅ Génère le token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "fallbackSecret",
      { expiresIn: "2h" }
    );

    console.log("✅ Token généré pour:", user.email);

    // ✅ Envoie bien le token dans la réponse
    return res.json({
      success: true,
      message: "Connexion réussie",
      token, // <= très important !
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        metadata: user.metadata || {},
      },
    });
  } catch (err) {
    console.error("❌ Erreur connexion:", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ============================
// 🧠 VERIFICATION TOKEN
// ============================
app.get("/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("🔑 Header reçu:", authHeader);

    if (!authHeader) {
      return res.status(401).json({ message: "Non autorisé — aucun header" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token manquant" });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecret");
    } catch (err) {
      console.error("❌ Erreur de vérification JWT:", err.message);
      return res.status(401).json({ message: "Token invalide ou expiré" });
    }

    const result = await pool.query(
      "SELECT id, name, email, metadata FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Utilisateur introuvable" });

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Erreur /auth/me:", err);
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
});
// ============================
// 🤖 ROUTE D'ANALYSE IA (MyMír V2 modulaire)
// ============================
import multer from "multer";
import { analyzeTender } from "./ai/analyzeTender.js";

// 📂 Config de stockage temporaire
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// 📍 Route principale
app.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const result = await analyzeTender(filePath);
    res.json(result);
  } catch (err) {
    console.error("❌ Erreur /analyze :", err);
    res.status(500).json({ success: false, message: "Erreur lors de l'analyse." });
  }
});

// ============================
// 🌍 ROUTES FRONTEND — FIX Render
// ============================

import fs from "fs";

// ✅ Ce bloc vient APRÈS les routes API
app.get("/*", (req, res) => {
  const filePath = path.join(__dirname, "public", req.path);

  // Si le fichier existe vraiment dans /public, on le renvoie
  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }

  // Sinon, on renvoie index.html (page d'accueil)
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ============================
// 🚀 LANCEMENT DU SERVEUR
// ============================
app.listen(PORT, () =>
  console.log(`✅ Serveur MyMír en ligne sur le port ${PORT}`)
);

