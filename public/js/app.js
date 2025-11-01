// ================================
// 🧠 app.js — Tableau de bord MyMír
// ================================

document.addEventListener("DOMContentLoaded", async () => {
  function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}
  // ================================
  // 🔐 Vérification de la session
  // ================================
  const token = localStorage.getItem("token") || getCookie("token");
  if (!token) {
    console.warn("⚠️ Aucun token trouvé, redirection vers la page de connexion.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("https://mymir.on***REMOVED***/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (!data.success) {
      console.warn("❌ Token invalide ou expiré.");
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    const user = data.user;
    console.log("✅ Profil chargé :", user);

    document.getElementById("companyName").textContent =
      user.metadata?.companyName || "Entreprise";

    // Remplissage profil
    document.getElementById("p_company").textContent = user.metadata?.companyName || "—";
    document.getElementById("p_email").textContent = user.email || "—";
    document.getElementById("p_country").textContent = user.metadata?.country || "—";
    document.getElementById("p_sector").textContent = user.metadata?.sector || "—";
    document.getElementById("p_effectif").textContent = user.metadata?.effectif || "—";
document.getElementById("p_certifications").textContent = user.metadata?.certifications || "—";
document.getElementById("p_siteweb").textContent = user.metadata?.siteWeb || "—";
document.getElementById("p_turnover").textContent = user.metadata?.turnover || "—";

    // Message d'accueil dynamique
    const firstName = user.name?.split(" ")[0] || "Utilisateur";
    document.getElementById("welcomeMessage").innerHTML =
      `Bienvenue <span style="color:#facc15;">${firstName} 👋</span>`;
  } catch (err) {
    console.error("❌ Erreur chargement profil :", err);
    localStorage.removeItem("token");
    window.location.href = "login.html";
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
  // 📂 Gestion de l'analyse
  // ================================
  const uploadArea = document.getElementById("uploadArea");
  const resultArea = document.getElementById("resultArea");
  const fileInput = document.getElementById("fileInput");
  const loading = document.getElementById("loading");
  const newAnalyse = document.getElementById("newAnalyse");

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
        const response = await fetch("https://mymir.on***REMOVED***/analyze", {
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

  // Réinitialiser l'analyse
  newAnalyse?.addEventListener("click", () => {
    resultArea.classList.add("hidden");
    uploadArea.classList.remove("hidden");
  });
});
// === Redirection vers la page de modification du profil ===
const editBtn = document.getElementById("editProfileBtn");
if (editBtn) {
  editBtn.addEventListener("click", () => {
    window.location.href = "edit-profile.html";
  });
}