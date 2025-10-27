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
