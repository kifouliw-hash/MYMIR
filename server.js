import express from "express";
import bodyParser from "body-parser";
import pool from "./db.js";
import bcrypt from "bcrypt";
import cors from "cors";
import path from "path";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

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

// ✅ INSCRIPTION
app.post("/register", async (req, res) => {
  try {
    const { companyName, managerName, email, sector, revenue, employees, country, certifications, password } = req.body;

    if (!email || !password || !companyName || !managerName)
      return res.status(400).json({ success: false, message: "Champs obligatoires manquants." });

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, metadata;`,
      [
        managerName,
        email,
        hashed,
        { companyName, sector, revenue, employees, country, certifications },
      ]
    );

    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("❌ Erreur inscription:", err);
    res.status(400).json({ success: false, message: "Erreur lors de l’inscription." });
  }
});

// ✅ CONNEXION
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

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "2h" });

    return res.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, metadata: user.metadata || {} },
      token
    });
  } catch (err) {
    console.error("❌ Erreur connexion:", err);
    res.status(500).json({ success: false, message: "Erreur serveur." });
  }
});

// ✅ VERIFICATION TOKEN
app.get("/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "Non autorisé" });

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query("SELECT id, name, email, metadata FROM users WHERE id = $1", [decoded.id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Utilisateur introuvable" });

    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error("Erreur /auth/me:", err);
    res.status(401).json({ message: "Token invalide ou expiré" });
  }
});

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => console.log(`✅ Serveur MyMír en ligne sur le port ${PORT}`));
