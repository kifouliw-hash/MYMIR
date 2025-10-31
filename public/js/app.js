// ================================
// 🧠 app.js — Tableau de bord MyMír
// ================================

document.addEventListener("DOMContentLoaded", async () => {
  // ================================
  // 🔐 Vérification de la session
  // ================================
  const token = localStorage.getItem("token");
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
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      console.log("🚪 Déconnexion utilisateur.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "login.html";
    });
  }

  // ================================
  // 🧭 Navigation entre pages (conserve le token)
  // ================================
  document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", () => {
      const target = link.dataset.target;
      if (target) {
        console.log(`🔁 Navigation vers ${target}`);
        window.location.href = target;
      }
    });
  });

  // ================================
  // 📊 Lancer une analyse (vers analyse.html)
  // ================================
  const analyseBtn = document.getElementById("launchAnalyseBtn");
  if (analyseBtn) {
    analyseBtn.addEventListener("click", () => {
      console.log("🚀 Redirection vers analyse.html");
      window.location.href = "analyse.html";
    });
  }
});