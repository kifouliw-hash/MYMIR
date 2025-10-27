import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/:page", (req, res) => {
  const filePath = path.join(__dirname, "public", `${req.params.page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) res.status(404).send("Page introuvable 😕");
  });
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`✅ Serveur MyMír opérationnel sur http://localhost:${PORT}`)
);
// === MyMír Server principal ===
// Utilise les modules ESM
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

// === Configuration de base ===
const app = express();
app.use(cors());
app.use(express.json());

// === Résolution des chemins pour Render ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// === Routes API ===
import siretRoute from "./backend/routes/siretRoute.js";
app.use("/api/siret", siretRoute);

// === Route par défaut ===
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// === Lancement du serveur ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ MyMír Server lancé sur le port ${PORT}`));
