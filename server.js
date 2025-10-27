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
import express from "express";
import cors from "cors";
import siretRoute from "./backend/routes/siretRoute.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// === Route SIRET ===
app.use("/api/siret", siretRoute);

// === Lancer serveur ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ MyMír Server lancé sur le port ${PORT}`));
