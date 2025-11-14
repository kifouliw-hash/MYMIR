// ================================
// 🧠 app.js — Tableau de bord MyMír
// ================================

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Chargement du tableau de bord MyMír...");

  // ================================
  // 🔐 Vérification de la session (token localStorage)
  // ================================
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("⚠️ Aucun token trouvé — redirection vers login.html");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("https://mymir.onrender.com/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    console.log("📡 Réponse /auth/me :", data);

    if (!data.success) {
      console.warn("❌ Token invalide ou expiré.");
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    const user = data.user;
    console.log("✅ Profil chargé :", user);

    // ================================
    // 🧾 Affichage du nom de l’entreprise
    // ================================
    document.getElementById("companyName").textContent =
      user.metadata?.companyName || "Entreprise";

// ================================
// 🧠 Remplissage + édition du profil MyMír
// ================================
const safeSet = (id, value) => {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "—";
};

safeSet("p_company", user.metadata?.companyName);
safeSet("p_email", user.email);
safeSet("p_country", user.metadata?.country);
safeSet("p_sector", user.metadata?.sector);
safeSet("p_soussecteur", user.metadata?.sousSecteur);
safeSet("p_effectif", user.metadata?.effectif);
safeSet("p_revenue", user.metadata?.revenue);
safeSet("p_certifications", user.metadata?.certifications);
safeSet("p_siteweb", user.metadata?.siteWeb);
safeSet("p_description", user.metadata?.description || "—");
    // ================================
    // 🎉 Message d’accueil dynamique
    // ================================
    const firstName = user.name?.split(" ")[0] || "Utilisateur";
    document.getElementById("welcomeMessage").innerHTML =
      `Bienvenue <span style="color:#facc15;">${firstName} 👋</span>`;

  } catch (err) {
    console.error("❌ Erreur lors du chargement du profil :", err);
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return;
  }

  // ================================
  // 🚪 Déconnexion
  // ================================
  document.getElementById("logoutBtn")?.addEventListener("click", () => {
    console.log("🚪 Déconnexion utilisateur.");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "login.html";
  });

  // ================================
  // 🧭 Navigation interne (SPA)
  // ================================
  const sections = document.querySelectorAll(".section");
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      sections.forEach(section => section.classList.remove("active"));
      const targetId = link.dataset.section;
      document.getElementById(targetId)?.classList.add("active");
    });
  });

  // ================================
  // 🚀 Bouton "Lancer une analyse"
  // ================================
  const analyseBtn = document.getElementById("launchAnalyseBtn");
  if (analyseBtn) {
    analyseBtn.addEventListener("click", () => {
      console.log("🔁 Ouverture de la section Analyse");
      document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
      document.getElementById("analyse").classList.add("active");
      document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
      document.querySelector('[data-section="analyse"]').classList.add("active");
    });
  }

  // ================================
  // 📂 Gestion de l'analyse (envoi de fichier)
  // ================================
  const uploadArea = document.getElementById("uploadArea");
  const resultArea = document.getElementById("resultArea");
  const fileInput = document.getElementById("fileInput");
  const loading = document.getElementById("loading");

  if (uploadArea && fileInput) {
    uploadArea.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  uploadArea.classList.add("hidden");
  loading.classList.remove("hidden");

  const formData = new FormData();
  formData.append("file", file);

  try {
    console.log("📤 Envoi du fichier à /analyze :", file.name);

    const response = await fetch("https://mymir.onrender.com/analyze", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const result = await response.json();
    console.log("📦 Résultat JSON brut:", result);

    loading.classList.add("hidden");

    // 🔥 1) Vérification succès
    if (!result.success) {
      uploadArea.classList.remove("hidden");
      uploadArea.innerHTML = `<p>❌ Erreur : ${result.message}</p>`;
      return;
    }

    // 🔥 2) Parse du JSON IA
    let parsed;
    try {
      parsed = JSON.parse(result.analysis);
    } catch (e) {
      console.error("❌ JSON IA invalide :", result.analysis);
      alert("❌ Impossible de lire l’analyse générée.");
      return;
    }

    console.log("📦 JSON PARSÉ :", parsed);

    // 🔥 3) Payload DB
    const payload = {
      title: parsed.titre || file.name.replace(/\.[^/.]+$/, ""),
      score: parsed.score || 0,
      summary: parsed.contexte || "",
      analysis: parsed
    };

    // 🔥 4) Save DB
    const saveRes = await fetch("https://mymir.onrender.com/api/save-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token
      },
      body: JSON.stringify(payload)
    });

    const saved = await saveRes.json();
    console.log("💾 Résultat sauvegarde :", saved);

    if (!saved.success) {
      alert("❌ Erreur lors de la sauvegarde de l’analyse.");
      return;
    }

    const analysisId = saved.id;

    // 🔥 5) Affichage du résultat
    resultArea.classList.remove("hidden");
    resultArea.innerHTML = `
      <h3>🧠 Résultat de l’analyse</h3>
      <div class="analysis-content">${formatAnalysis(parsed)}</div>

      <div class="analysis-btns">
        <button class="analysis-btn" id="downloadPdf">📥 Télécharger le rapport PDF</button>
        <button class="analysis-btn" id="newAnalyse">🔁 Nouvelle analyse</button>
      </div>
    `;

    // 🔥 6) Téléchargement PDF
    document.getElementById("downloadPdf").addEventListener("click", async () => {
      try {
        const res = await fetch(`https://mymir.onrender.com/api/analysis/${analysisId}/pdf`, {
          headers: { Authorization: "Bearer " + token }
        });

        if (!res.ok) {
          alert("⚠️ Impossible de télécharger le rapport PDF.");
          return;
        }

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `analyse-${analysisId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

      } catch (err) {
        console.error("Erreur téléchargement PDF :", err);
        alert("⚠️ Échec du téléchargement.");
      }
    });

    // 🔁 Nouvelle analyse
    document.getElementById("newAnalyse").addEventListener("click", () => {
      window.location.reload();
    });

  } catch (err) {
    console.error("❌ Erreur réseau :", err);
    loading.classList.add("hidden");
    uploadArea.classList.remove("hidden");
    uploadArea.innerHTML = `<p>⚠️ Erreur de connexion au serveur.</p>`;
  }
});
} // <-- AJOUTE CETTE ACCOLADE QUI MANQUAIT !!!

  
// ================================
// 🧩 Mode édition du profil
// ================================
const editBtn = document.getElementById("editProfileBtn");
const saveBtn = document.getElementById("saveProfileBtn");
const viewCard = document.getElementById("profileView");
const form = document.getElementById("profileEditForm");

if (editBtn && saveBtn && viewCard && form) {
  editBtn.addEventListener("click", () => {
    form.classList.remove("hidden");
    viewCard.classList.add("hidden");
    saveBtn.classList.remove("hidden");
    editBtn.classList.add("hidden");

    const getValue = (id) => document.getElementById(id)?.textContent || "";

    form.f_companyName.value = getValue("p_company");
    form.f_country.value = getValue("p_country");
    form.f_sector.value = getValue("p_sector");
    form.f_soussecteur.value = getValue("p_soussecteur");
    form.f_effectif.value = getValue("p_effectif");
    form.f_revenue.value = getValue("p_revenue");
    form.f_certifications.value = getValue("p_certifications");
    form.f_siteweb.value = getValue("p_siteweb");
    form.f_description.value = getValue("p_description");
  });

  saveBtn.addEventListener("click", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Session expirée, veuillez vous reconnecter.");
    return;
  }

  // ✅ Nettoyage des champs avant envoi
  const body = {
  companyName: form.f_companyName.value.trim(),
  country: form.f_country_custom?.value.trim() || form.f_country.value.trim(),
  sector: form.f_sector_custom?.value.trim() || form.f_sector.value.trim(),
  sousSecteur: form.f_soussecteur.value.trim(),
  effectif: form.f_effectif.value.trim(),
  revenue: form.f_revenue.value.trim(),
  certifications: form.f_certifications.value.trim(),
  siteWeb: form.f_siteweb.value.trim(),
  description: form.f_description.value.trim(),
};


  // ✅ Suppression des champs vides
  Object.keys(body).forEach(key => {
    if (!body[key]) delete body[key];
  });

 try {
  const res = await fetch("https://mymir.onrender.com/api/update-profile", {
    method: "PUT",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    // ✅ astuce : Render bloque les champs undefined, donc on stringify proprement
    body: JSON.stringify({
      ...body,
      timestamp: new Date().toISOString() // pour forcer une requête “fraîche”
    }),
  });

  // 🔍 Sécurité : lecture brute puis parsing
  const text = await res.text();
  let result;
  try { result = JSON.parse(text); } catch { result = { success: false }; }

  if (res.ok && result.success) {
    alert("✅ Profil mis à jour avec succès !");
    setTimeout(() => window.location.reload(), 800);
  } else {
    console.error("⚠️ Réponse inattendue :", text);
    alert("❌ Échec de la mise à jour du profil.");
  }
} catch (error) {
  console.error("🚨 Erreur réseau :", error);
  alert("Erreur réseau — vérifie ta connexion Render.");
}

    });
  }

// ================================
// 📜 Chargement de l’historique des analyses
// ================================
async function loadHistory() {
  console.log("🚀 Chargement du tableau de bord MyMír...");

  // 🔑 Récupération et nettoyage du token
  let token = (localStorage.getItem("token") || "").replace(/^"|"$/g, "");
  if (!token || token.length < 10) {
    alert("⚠️ Votre session a expiré. Veuillez vous reconnecter.");
    window.location.href = "login.html";
    return;
  }

  try {
    // ✅ Logs de debug pour Render
    console.log("🔑 Token actuel (nettoyé) :", token);
    console.log("🌐 URL appelée : https://mymir.onrender.com/api/analyses");

    const res = await fetch("https://mymir.onrender.com/api/analyses", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json",
      },
    });

    // 🚨 Vérifie la validité de la réponse HTTP
    if (!res.ok) {
      console.error("❌ Erreur HTTP :", res.status, res.statusText);
      throw new Error(`Erreur serveur (${res.status})`);
    }

    // ✅ Tentative de parsing du JSON
    const data = await res.json();
    console.log("📦 Données reçues :", data);

    // 🧩 Vérifie la structure attendue
    if (!data.success || !Array.isArray(data.analyses)) {
      console.warn("⚠️ Format inattendu :", data);
      throw new Error("Format de données invalide depuis le serveur.");
    }

    // 🎯 Cible le tableau HTML
    const tbody = document.getElementById("historyBody");
    tbody.innerHTML = "";

    if (data.analyses.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4">Aucune analyse enregistrée pour le moment.</td></tr>`;
      return;
    }

    // 🧱 Remplissage dynamique
    data.analyses.forEach((a) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${new Date(a.created_at).toLocaleDateString("fr-FR")}</td>
        <td>${a.title || "Analyse sans titre"}</td>
        <td>${a.score ? a.score + "%" : "—"}</td>
        <td>
          <span class="status success">✔️ Terminé</span>
          <button class="download-btn" data-id="${a.id}">🗒 TXT</button>
          <button class="download-pdf" data-id="${a.id}">📄 PDF</button>
        </td>
      `;
      tbody.appendChild(row);
    });

    console.log("✅ Historique affiché avec succès !");
  } catch (err) {
    console.error("❌ Erreur chargement historique :", err);
    const tbody = document.getElementById("historyBody");
    tbody.innerHTML =
      `<tr><td colspan="4">⚠️ Impossible de charger l’historique.</td></tr>`;
  }
}
// ================================
// ⬇️ Téléchargement d’un rapport d’analyse
// ================================
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("download-btn")) {
    const id = e.target.dataset.id;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`https://mymir.onrender.com/api/analysis/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Erreur lors du téléchargement");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cleanTitle = (result.title || "analyse").replace(/[^a-zA-Z0-9_-]/g, "_");
a.download = `${cleanTitle}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Erreur téléchargement :", err);
      alert("⚠️ Impossible de télécharger ce rapport.");
    }
  }
});
// ================================
// ⬇️ Téléchargement d’un rapport PDF
// ================================
document.addEventListener("click", async (e) => {
  if (e.target.classList.contains("download-pdf")) {
    const id = e.target.dataset.id;
    const token = localStorage.getItem("token");

    // 🧱 Vérification du token avant envoi
    if (!token) {
      alert("⚠️ Votre session a expiré. Veuillez vous reconnecter.");
      window.location.href = "login.html";
      return;
    }

    try {
      console.log("📡 Téléchargement PDF pour analyse ID :", id);

      // ✅ Appel sécurisé vers Render
      const res = await fetch(`https://mymir.onrender.com/api/analysis/${id}/pdf`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Accept": "application/pdf",
        },
      });

      // 🚨 Gestion des erreurs HTTP
      if (!res.ok) {
        console.error("❌ Réponse non OK :", res.status, res.statusText);
        throw new Error(`Erreur PDF (${res.status})`);
      }

      // 📄 Conversion en Blob pour téléchargement
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analyse-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      console.log("✅ PDF téléchargé avec succès !");
    } catch (err) {
      console.error("❌ Erreur téléchargement PDF :", err);
      alert("⚠️ Impossible de télécharger le PDF. Vérifie la console pour le détail.");
    }
  }
});
// 🧩 Afficher champ personnalisé pour secteur
const sectorSelect = document.getElementById("f_sector");
const sectorCustom = document.getElementById("f_sector_custom");
if (sectorSelect && sectorCustom) {
  sectorSelect.addEventListener("change", () => {
    if (sectorSelect.value === "Autre (spécifier manuellement)") {
      sectorCustom.classList.remove("hidden");
    } else {
      sectorCustom.classList.add("hidden");
      sectorCustom.value = "";
    }
  });
}
// 🌍 Afficher champ personnalisé pour pays
const countrySelect = document.getElementById("f_country");
const countryCustom = document.getElementById("f_country_custom");
if (countrySelect && countryCustom) {
  countrySelect.addEventListener("change", () => {
    if (countrySelect.value === "Autre (spécifier manuellement)") {
      countryCustom.classList.remove("hidden");
    } else {
      countryCustom.classList.add("hidden");
      countryCustom.value = "";
    }
  });
}
// 🎨 Affiche "Non renseigné" à la place des tirets vides
function afficherChampsVides() {
  const champs = [
    { id: "p_company", label: "Entreprise" },
    { id: "p_email", label: "Email" },
    { id: "p_country", label: "Pays" },
    { id: "p_sector", label: "Secteur" },
    { id: "p_soussecteur", label: "Sous-secteur" },
    { id: "p_effectif", label: "Effectif" },
    { id: "p_revenue", label: "Chiffre d’affaires" },
    { id: "p_certifications", label: "Certifications" },
    { id: "p_siteweb", label: "Site web / LinkedIn" },
    { id: "p_description", label: "Description" },
  ];

  champs.forEach(champ => {
    const el = document.getElementById(champ.id);

    if (el && (el.textContent.trim() === "—" || el.textContent.trim() === "")) {
      el.textContent = "Non renseigné";
      el.classList.add("placeholder-style");
    } else if (el) {
      el.classList.remove("placeholder-style");
    }
  }); // <-- fermeture du forEach

} // <-- fermeture DE LA FONCTION


// Appel après chargement du profil
window.addEventListener("load", afficherChampsVides);

// ================================
// 🧩 Convertit JSON -> HTML Premium (global, accessible partout)
// ================================
function formatAnalysis(raw) {
  let json;

  // 🟦 Si raw est déjà un objet JSON
  if (typeof raw === "object") {
    json = raw;
  } else {
    // 🟨 Sinon on nettoie et on parse
    try {
      raw = raw
        .replace(/```json|```/g, "")
        .replace(/\n{2,}/g, "\n")
        .trim();

      json = JSON.parse(raw);
    } catch {
      return `<div class='analysis-block'>${raw}</div>`;
    }
  }

  const section = (title, content) => `
    <div class="analysis-section">
      <h3>${title}</h3>
      <div class="analysis-text">${content || "—"}</div>
    </div>
  `;

  return `
    ${section("📌 Titre", json.titre)}
    ${section("🏛️ Autorité", json.autorite)}
    ${section("📅 Date limite", json.date_limite)}
    ${section("📂 Type de marché", json.type_marche)}
    ${section("📝 Contexte", json.contexte)}
    ${section("📑 Documents requis", (json.documents_requis || []).join("<br>"))}
    ${section("📊 Analyse du profil", json.analyse_profil)}
    ${section("💡 Recommandations", (json.recommandations || []).join("<br>"))}
    ${section("📅 Plan de dépôt", (json.plan_de_depot || []).join("<br>"))}
    ${section("🧾 Checklist", (json.checklist || []).join("<br>"))}
    ${section("🎯 Score", `${json.score || "---"} / 100`)}
  `;
}




// 🔁 Charger automatiquement l’historique au démarrage
loadHistory();
});
