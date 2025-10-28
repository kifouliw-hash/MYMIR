// === Navigation entre les sections ===
document.querySelectorAll(".nav-link").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    document.getElementById(btn.dataset.section).classList.add("active");
  });
});

// === Récupération utilisateur connecté ===
window.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("myMirUser"));
  if (!user) window.location.href = "login.html";

  document.getElementById("companyName").textContent = user.company || "Entreprise";
  document.getElementById("p_company").textContent = user.company || "—";
  document.getElementById("p_email").textContent = user.email || "—";
  document.getElementById("p_country").textContent = user.country || "—";
  document.getElementById("p_sector").textContent = user.sector || "—";
});

// === Déconnexion ===
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("myMirUser");
  window.location.href = "login.html";
});

// === Zone d’upload (simulation) ===
const uploadArea = document.getElementById("uploadArea");
const fileInput = document.getElementById("fileInput");
const resultArea = document.getElementById("resultArea");

uploadArea.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => showResults());
uploadArea.addEventListener("dragover", e => {
  e.preventDefault();
  uploadArea.style.background = "rgba(255,255,255,0.15)";
});
uploadArea.addEventListener("dragleave", e => {
  e.preventDefault();
  uploadArea.style.background = "rgba(255,255,255,0.08)";
});
uploadArea.addEventListener("drop", e => {
  e.preventDefault();
  showResults();
});

function showResults() {
  uploadArea.classList.add("hidden");
  resultArea.classList.remove("hidden");
}
