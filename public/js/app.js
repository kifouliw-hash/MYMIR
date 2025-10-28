// ================================
// 🧠 app.js — Tableau de bord MyMír
// ================================

// Gestion du menu latéral
const sections = document.querySelectorAll(".section");
const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach(link => {
  link.addEventListener("click", () => {
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");

    sections.forEach(section => section.classList.remove("active"));
    document.getElementById(link.dataset.section).classList.add("active");
  });
});

// ================================
// 🔐 Authentification utilisateur
// ================================

const API_BASE = window.location.origin; // fonctionne sur Render aussi
const token = localStorage.getItem("token");

if (!token) {
  console.warn("⚠️ Aucun token trouvé, redirection vers la page de connexion.");
  window.location.href = "login.html";
} else {
  fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(res => res.json())
    .then(data => {
      if (!data.success) {
        console.warn("❌ Token invalide ou expiré, redirection.");
        localStorage.removeItem("token");
        window.location.href = "login.html";
        return;
      }

      const user = data.user;
      console.log("✅ Profil chargé :", user);

      // Sidebar
      document.getElementById("companyName").textContent =
        user.metadata?.companyName || "Entreprise";

      // Profil
      document.getElementById("p_company").textContent =
        user.metadata?.companyName || "—";
      document.getElementById("p_email").textContent = user.email || "—";
      document.getElementById("p_country").textContent =
        user.metadata?.country || "—";
      document.getElementById("p_sector").textContent =
        user.metadata?.sector || "—";
    })
    .catch(err => {
      console.error("Erreur chargement profil :", err);
      window.location.href = "login.html";
    });
}

// ================================
// 🚪 Déconnexion
// ================================
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// ================================
// 📊 Simulation d’analyse (test UI)
// ================================
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const loading = document.getElementById("loading");
const resultArea = document.getElementById("resultArea");

if (uploadArea && fileInput) {
  uploadArea.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", simulateAnalysis);
}

function simulateAnalysis() {
  uploadArea.classList.add("hidden");
  loading.classList.remove("hidden");

  setTimeout(() => {
    loading.classList.add("hidden");
    resultArea.classList.remove("hidden");
  }, 2000);
}

document.getElementById("newAnalyse")?.addEventListener("click", () => {
  resultArea.classList.add("hidden");
  uploadArea.classList.remove("hidden");
});
