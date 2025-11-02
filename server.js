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
app.use(cors({
  origin: "https://mymir.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
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

    await pool.query(
      `INSERT INTO analyses (user_id, title, score, summary, analysis)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, title, score || null, summary || "", analysis]
    );

    console.log(`✅ Nouvelle analyse enregistrée pour l’utilisateur ${userId}`);
    res.json({ success: true, message: "Analyse sauvegardée avec succès ✅" });
  } catch (err) {
    console.error("❌ Erreur sauvegarde analyse :", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});
// ===================================================
// 📄 Téléchargement du rapport PDF (corrigé + fontkit intégré)
// ===================================================

app.get("/api/analysis/:id/pdf", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "Token manquant" });

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
    const title = analysis.title || "Analyse sans titre";
    const score = analysis.score !== null ? `${analysis.score}%` : "—";
    const summary = analysis.summary || "Aucun résumé fourni.";
    const content = analysis.analysis || "Aucune analyse disponible.";

    // ✅ Chemin vers la police
    const fontPath = path.join(__dirname, "public", "fonts", "NotoSans-Regular.ttf");
    if (!fs.existsSync(fontPath)) {
      console.error("❌ Police introuvable :", fontPath);
      return res.status(500).json({ success: false, message: "Police PDF manquante." });
    }

    const fontBytes = fs.readFileSync(fontPath);

    // ✅ Création du PDF et enregistrement du moteur de police
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit); // ⬅️ CRITIQUE : Active la gestion des polices personnalisées
    const customFont = await pdfDoc.embedFont(fontBytes);

    const createPage = () => {
      const page = pdfDoc.addPage([595, 842]);
      const { width, height } = page.getSize();
      return { page, width, height, y: height - 80 };
    };

    let { page, width, height, y } = createPage();
    const margin = 50;
    const lineHeight = 16;

    // === En-tête
    page.drawText("Rapport d’analyse — MyMír", {
      x: margin,
      y,
      size: 18,
      font: customFont,
      color: rgb(0.2, 0.2, 0.2),
    });
    y -= 30;

    // === Métadonnées
    const metaLines = [
      `Titre : ${title}`,
      `Score : ${score}`,
      `Date : ${new Date(analysis.created_at).toLocaleString("fr-FR")}`,
      `Résumé : ${summary}`,
    ];
    metaLines.forEach((line) => {
      page.drawText(line, { x: margin, y, size: 12, font: customFont });
      y -= lineHeight;
    });

    y -= 15;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    y -= 25;

    // === Corps de texte
    const cleanContent = content
      .replace(/\*\*/g, "")
      .replace(/#{1,6}\s*/g, "")
      .replace(/\*/g, "• ")
      .replace(/\n{2,}/g, "\n")
      .trim();

    const lines = cleanContent.split("\n");
    for (const line of lines) {
      const chunks = line.match(/.{1,95}/g) || [" "];
      for (const chunk of chunks) {
        if (y < 60) ({ page, width, height, y } = createPage());
        page.drawText(chunk, { x: margin, y, size: 11, font: customFont });
        y -= lineHeight;
      }
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="analyse-${analysis.id}.pdf"`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("❌ Erreur génération PDF :", err);
    res.status(500).json({
      success: false,
      message: `Erreur lors de la génération du PDF : ${err.message}`,
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
      "SELECT id, title, score, created_at FROM analyses WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    res.json({
      success: true,
      analyses: rows || [],
    });
  } catch (err) {
    console.error("❌ Erreur /api/analyses :", err);
    res.status(500).json({
      success: false,
      message: "Erreur lors du chargement des analyses.",
    });
  }
});
// ===================================================
// 📄 Téléchargement du rapport TXT (analyse brute)
// ===================================================
app.get("/api/analysis/:id/download", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ success: false, message: "Token manquant" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbackSecret");
    const userId = decoded.id;
    const analysisId = req.params.id;

    // 🔎 On récupère l’analyse dans la base
    const { rows } = await pool.query(
      "SELECT * FROM analyses WHERE id = $1 AND user_id = $2",
      [analysisId, userId]
    );

    if (rows.length === 0)
      return res.status(404).json({ success: false, message: "Analyse introuvable" });

    const analysis = rows[0];
    const title = analysis.title || "Analyse sans titre";
    const score = analysis.score !== null ? `${analysis.score}%` : "—";
    const summary = analysis.summary || "Aucun résumé fourni.";
    const content = analysis.analysis || "Aucune analyse disponible.";

    // 🧱 Structure du fichier TXT
    const textContent = `
Rapport d'analyse — MyMír
==========================

Titre : ${title}
Score : ${score}
Date : ${new Date(analysis.created_at).toLocaleString("fr-FR")}
Résumé : ${summary}

----------------------------
CONTENU DE L’ANALYSE
----------------------------

${content}
    `.trim();

    // 📤 Envoi du fichier TXT
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="analyse-${analysis.id}.txt"`
    );
    res.send(textContent);

  } catch (err) {
    console.error("❌ Erreur génération TXT :", err);
    res.status(500).json({
      success: false,
      message: `Erreur lors du téléchargement TXT : ${err.message}`,
    });
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

// ===================================================
// 🚀 LANCEMENT DU SERVEUR
// ===================================================
app.listen(PORT, () => console.log(`✅ Serveur MyMír en ligne sur le port ${PORT}`));