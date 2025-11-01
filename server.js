// ===================================================
// 🌐 MyMír — Serveur principal
// ===================================================

import express from "express";
import bodyParser from "body-parser";
import pool from "./db.js";
import bcrypt from "bcrypt";
import cors from "cors";
import path from "path";
import jwt from "jsonwebtoken";
import fs from "fs";
import { fileURLToPath } from "url";
import "dotenv/config";

import siretRoutes from "./backend/routes/siretRoute.js";
import pkg from "multer";
import { analyzeTender } from "./backend/ai/analyzeTender.js";
console.log("🚀 Lancement serveur MyMír...");
console.log("🔑 OpenAI Key:", process.env.***REMOVED*** ? "✅ détectée" : "❌ manquante");
console.log("🔒 JWT Secret:", process.env.JWT_SECRET ? "✅ détecté" : "❌ manquant");


// ===================================================
// ⚙️ Configuration de base
// ===================================================
const app = express();
const PORT = process.env.PORT || 3000;
const multer = pkg.default || pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/siret", siretRoutes);

// ===================================================
// 🧱 Vérifie la table users au démarrage
// ===================================================
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

// ===================================================
// 🚀 INSCRIPTION
// ===================================================
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

    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0)
      return res.status(409).json({ success: false, message: "Cet email est déjà enregistré." });

    const hashed = await bcrypt.hash(password, 10);

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
  } catch (err) {
    console.error("❌ Erreur inscription:", err);
    res.status(500).json({ success: false, message: "Erreur serveur lors de l'inscription." });
  }
});

// ===================================================
// 🔐 CONNEXION
// ===================================================
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

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "fallbackSecret",
      { expiresIn: "2h" }
    );

    console.log("✅ Token généré pour:", user.email);

    res.json({
      success: true,
      message: "Connexion réussie",
      token,
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

// ===================================================
// 🧠 VERIFICATION TOKEN
// ===================================================
app.get("/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Non autorisé" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Token manquant" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecret");
    const result = await pool.query("SELECT id, name, email, metadata FROM users WHERE id = $1", [
      decoded.id,
    ]);

    if (result.rows.length === 0)
      return res.status(404).json({ message: "Utilisateur introuvable" });

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Erreur /auth/me:", err);
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
});

// ===================================================
// 🤖 ROUTE D'ANALYSE IA (MyMír)
// ===================================================
console.log("✅ Multer importé sans erreur");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "public/uploads/"),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

app.post("/analyze", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Aucun fichier reçu." });
    const filePath = req.file.path;
    const result = await analyzeTender(filePath);
    res.json(result);
  } catch (err) {
    console.error("❌ Erreur /analyze :", err);
    res.status(500).json({ success: false, message: "Erreur lors de l'analyse." });
  }
});

// ===================================================
// 🌍 ROUTES FRONTEND — pour Render
// ===================================================
app.get("/*", (req, res) => {
  const filePath = path.join(__dirname, "public", req.path);
  if (fs.existsSync(filePath) && fs.lstatSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
// =========================================
// 🔧 ROUTE MISE À JOUR DU PROFIL ENTREPRISE
// =========================================
app.put("/api/update-profile", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Token manquant" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecret");
    const userId = decoded.id;

    const { companyName, sector, country, effectif, certifications, siteWeb, turnover } = req.body;

    const newMetadata = { companyName, sector, country, effectif, certifications, siteWeb, turnover };

    await pool.query("UPDATE users SET metadata = $1 WHERE id = $2", [newMetadata, userId]);

    res.json({ success: true, message: "Profil mis à jour avec succès" });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ===================================================
// 🚀 LANCEMENT DU SERVEUR
// ===================================================
app.listen(PORT, () => console.log(`✅ Serveur MyMír en ligne sur le port ${PORT}`));
