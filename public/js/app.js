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
    // 🧠 Remplissage des infos du profil
    // ================================
    const safeSet = (id, value) => {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "—";
};

safeSet("p_company", user.metadata?.companyName);
safeSet("p_email", user.email);
safeSet("p_country", user.metadata?.country);
safeSet("p_sector", user.metadata?.sector);
safeSet("p_effectif", user.metadata?.effectif);
safeSet("p_certifications", user.metadata?.certifications);
safeSet("p_siteweb", user.metadata?.siteWeb);
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
        console.log("📦 Résultat JSON :", result);

        loading.classList.add("hidden");

        if (result.success) {
          resultArea.classList.remove("hidden");
          resultArea.innerHTML = `
            <h3>🧠 Résultat de l’analyse</h3>
            <pre style="white-space: pre-wrap;">${result.analysis}</pre>
            <div class="analysis-btns">
              <button class="analysis-btn" id="newAnalyse">🔁 Nouvelle analyse</button>
            </div>`;
        } else {
          uploadArea.classList.remove("hidden");
          uploadArea.innerHTML = `<p>❌ Erreur : ${result.message}</p>`;
        }
      } catch (err) {
        console.error("❌ Erreur réseau :", err);
        loading.classList.add("hidden");
        uploadArea.classList.remove("hidden");
        uploadArea.innerHTML = `<p>⚠️ Erreur de connexion au serveur.</p>`;
      }
    });
  }

  // ================================
  // 🔁 Réinitialisation d'une analyse
  // ================================
  document.addEventListener("click", (e) => {
    if (e.target.id === "newAnalyse") {
      resultArea.classList.add("hidden");
      uploadArea.classList.remove("hidden");
    }
  });
  // ================================
  // 🧩 Mode édition du profil (SPA)
  // ================================
  const editBtn = document.getElementById("editProfileBtn");
  const saveBtn = document.getElementById("saveProfileBtn");
  const viewCard = document.getElementById("profileView");
  const form = document.getElementById("profileEditForm");

  if (editBtn && saveBtn && viewCard && form) {
    // Activer le mode édition
    editBtn.addEventListener("click", () => {
      form.classList.remove("hidden");
      viewCard.classList.add("hidden");
      saveBtn.classList.remove("hidden");
      editBtn.classList.add("hidden");

      // Remplir le formulaire avec les données actuelles
     const getValue = (id) => document.getElementById(id)?.textContent || "";

form.f_companyName.value = getValue("p_company");
form.f_country.value = getValue("p_country");
form.f_sector.value = getValue("p_sector");
form.f_effectif.value = getValue("p_effectif");
form.f_certifications.value = getValue("p_certifications");
form.f_siteweb.value = getValue("p_siteweb");
    });

    // Sauvegarder les modifications
    saveBtn.addEventListener("click", async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Session expirée, veuillez vous reconnecter.");
        return;
      }

      const body = {
        companyName: form.f_companyName.value,
        country: form.f_country.value,
        sector: form.f_sector.value,
        effectif: form.f_effectif.value,
        certifications: form.f_certifications.value,
        siteWeb: form.f_siteweb.value,
      };

      try {
        const res = await fetch("https://mymir.onrender.com/api/update-profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
        });

        const result = await res.json();
        if (result.success) {
  alert("✅ Profil mis à jour avec succès !");
  setTimeout(() => window.location.reload(), 700);
} else {
  alert("❌ Erreur lors de la mise à jour du profil.");
}
      } catch (error) {
        console.error("Erreur update profil :", error);
        alert("Erreur réseau.");
      }
    });
  }
});