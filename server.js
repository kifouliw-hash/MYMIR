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
import fontkit from "@pdf-lib/fontkit";
import siretRoutes from "./backend/routes/siretRoute.js";
import pkg from "multer";
import { analyzeTender } from "./backend/ai/analyzeTender.js";
import cookieParser from "cookie-parser";
import { PDFDocument, rgb } from "pdf-lib";
import { generatePdfFromAnalysis } from "./backend/pdf/generatePdf.js";


console.log("🚀 Lancement serveur MyMír...");
console.log("🔑 OpenAI Key:", process.env.OPENAI_API_KEY ? "✅ détectée" : "❌ manquante");
console.log("🔒 JWT Secret:", process.env.JWT_SECRET ? "✅ détecté" : "❌ manquant");

// ===================================================
// ⚙️ Configuration de base
// ===================================================
const app = express();
const PORT = process.env.PORT || 3000;
const multer = pkg.default || pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middlewares
app.use(cookieParser());

const allowedOrigins = [
  "https://mymir.onrender.com",
  "https://mymir-react.onrender.com",
  "http://localhost:3000"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
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
// 🧱 Vérifie la table analyses au démarrage
// ===================================================
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title TEXT,
        score INTEGER,
        summary TEXT,
        analysis TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("🧱 Table 'analyses' vérifiée et créée 🔄✅");
  } catch (err) {
    console.error("⚠️ Erreur création table analyses :", err);
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
    console.log("✅ Nouveau compte créé et connecté :", email);

    res.status(200).json({
      success: true,
      message: "Compte créé avec succès et connecté",
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
    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: "Utilisateur introuvable." });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ success: false, message: "Mot de passe incorrect." });
    }

    // ⬇️ CRITIQUE : on RENVOIE le token dans la réponse JSON
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || "fallbackSecret",
      { expiresIn: "2h" }
    );

    return res.json({
      success: true,
      message: "Connexion réussie",
      token, // ⬅️ IMPORTANT
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
// 🧠 VERIFICATION TOKEN (via cookie)
// ===================================================
app.get("/auth/me", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ success: false, message: "Token manquant" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecret");
    const { rows } = await pool.query(
      "SELECT id, name, email, metadata FROM users WHERE id = $1",
      [decoded.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    }
    res.json({ success: true, user: rows[0] });
  } catch (e) {
    console.error("Erreur /auth/me:", e);
    res.status(401).json({ success: false, message: "Token invalide ou expiré" });
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
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Token manquant." });

    if (!req.file)
      return res.status(400).json({ success: false, message: "Aucun fichier reçu." });

    const filePath = req.file.path;

    // 🔥 Envoi du TOKEN (PAS l’objet profil)
    const result = await analyzeTender(filePath, token);

    return res.json(result);

  } catch (err) {
    console.error("❌ Erreur /analyze :", err);
    res.status(500).json({ success: false, message: "Erreur lors de l'analyse." });
  }
});



// ===================================================
// 💾 Sauvegarde d'une analyse IA
// ===================================================
app.post("/api/save-analysis", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Token manquant" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecret");
    const userId = decoded.id;

    const { title, score, summary, analysis } = req.body;

    if (!title || !analysis)
      return res.status(400).json({ success: false, message: "Champs requis manquants." });

   const { rows } = await pool.query(
  `INSERT INTO analyses (user_id, title, score, summary, analysis)
   VALUES ($1, $2, $3, $4, $5)
   RETURNING id;`,
  [userId, title, score || null, summary || "", JSON.stringify(analysis)]
);

    console.log(`✅ Nouvelle analyse enregistrée ID ${rows[0].id}`);

    res.json({
      success: true,
      id: rows[0].id,  // 🔥 ID renvoyé ici !
      message: "Analyse sauvegardée avec succès"
    });

  } catch (err) {
    console.error("❌ Erreur sauvegarde analyse :", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ===================================================
// 📄 Téléchargement du rapport PDF — Version premium stylisée MyMír
// ===================================================
app.get("/api/analyses/:id/pdf", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Token manquant" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecret");
    const userId = decoded.id;

    const analysisId = req.params.id;

    const { rows } = await pool.query(
      "SELECT * FROM analyses WHERE id = $1 AND user_id = $2",
      [analysisId, userId]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Analyse introuvable" });

    const analysis = rows[0];

    let clean = {};
    try { clean = JSON.parse(analysis.analysis); } catch {}

    // Charger profil entreprise
    let profilEntreprise = {};
    const userRes = await pool.query("SELECT metadata FROM users WHERE id = $1", [userId]);
    if (userRes.rows.length > 0) profilEntreprise = userRes.rows[0].metadata;

    const data = {
      title: analysis.title,
      score: analysis.score,
      summary: analysis.summary,
      analysis_json: clean,
      profilEntreprise
    };

    // 🔥 IMPORTANT : RETURN sinon Express écrit 2 fois
    return generatePdfFromAnalysis(res, data);

  } catch (err) {
    console.error("❌ PDF ERROR :", err);
    return res.status(500).json({
      success: false,
      message: "Erreur génération PDF"
    });
  }
});


// ===================================================
// 📜 HISTORIQUE DES ANALYSES (liste par utilisateur)
// ===================================================
app.get("/api/analyses", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Token manquant" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecret");
    const userId = decoded.id;

    const { rows } = await pool.query(
      "SELECT id, title, score, analysis, created_at FROM analyses WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    // Parse l'objet analysis pour chaque ligne
    const analyses = rows.map(row => ({
      _id: row.id,
      title: row.title,
      score: row.score,
      analysis: typeof row.analysis === 'string' ? JSON.parse(row.analysis) : row.analysis,
      generated_at: row.created_at
    }));

    res.json(analyses);
  } catch (err) {
    console.error("❌ Erreur /api/analyses :", err);
    res.status(500).json({ success: false, message: "Erreur lors du chargement des analyses." });
  }
});

// ===================================================
// 🧩 MISE À JOUR DU PROFIL UTILISATEUR
// ===================================================
app.put("/api/update-profile", async (req, res) => {
  try {
    // 🔐 Vérifie la présence du token JWT
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Token manquant" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecret");
    const userId = decoded.id;

    // 📦 Champs reçus du front
    const {
      companyName,
      country,
      sector,
      sousSecteur,
      effectif,
      revenue,
      certifications,
      siteWeb,
      description,
    } = req.body;

    // 🧠 Vérifie que l’utilisateur existe
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Utilisateur introuvable" });
    }

    const currentMetadata = rows[0].metadata || {};

    // 🧱 Fusionne l'ancien metadata et les nouveaux champs
    const newMetadata = {
      ...currentMetadata,
      ...(companyName && { companyName }),
      ...(country && { country }),
      ...(sector && { sector }),
      ...(sousSecteur && { sousSecteur }),
      ...(effectif && { effectif }),
      ...(revenue && { revenue }),
      ...(certifications && { certifications }),
      ...(siteWeb && { siteWeb }),
      ...(description && { description }),
    };

    // 💾 Met à jour en base
    await pool.query("UPDATE users SET metadata = $1 WHERE id = $2", [
      JSON.stringify(newMetadata),
      userId,
    ]);

    console.log(`✅ Profil mis à jour pour l’utilisateur ${rows[0].email}`);
    res.json({ success: true, message: "Profil mis à jour avec succès ✅" });
  } catch (error) {
    console.error("❌ Erreur /api/update-profile :", error);
    res.status(500).json({ success: false, message: "Erreur serveur lors de la mise à jour du profil." });
  }
});

// ===================================================
// 🌍 ROUTES FRONTEND FIX — Compatible Render
// ===================================================
const publicDir = path.join(__dirname, "public");

// Sert correctement les fichiers statiques (JS, CSS, PNG…)
app.use(express.static(publicDir, {
  extensions: ["html"]
}));

// Route fallback : renvoie index.html pour les pages frontend (SPA)
app.get("*", (req, res) => {
  // Ne pas intercepter les API !
  if (req.path.startsWith("/api")) return res.status(404).json({ error: "Route API inconnue" });

  res.sendFile(path.join(publicDir, "index.html"));
});


// ===================================================
// 🚀 LANCEMENT DU SERVEUR
// ===================================================
app.listen(PORT, () => console.log(`✅ Serveur MyMír en ligne sur le port ${PORT}`));
