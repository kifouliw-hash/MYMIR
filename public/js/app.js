const API_BASE = "https://mymir.on***REMOVED***";
const ADMIN_KEY = "mir-admin-2025";

// === Fond animé (vagues dynamiques) ===
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let t = 0;
function animateBg() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#f5b841");
  gradient.addColorStop(1, "#4facfe");
  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  for (let x = 0; x < canvas.width; x++) {
    const y = Math.sin((x + t) * 0.01) * 25 + canvas.height / 2;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.fill();
  t += 2;
  requestAnimationFrame(animateBg);
}
animateBg();

// === Navigation entre sections ===
const menuItems = document.querySelectorAll(".menu li");
const sections = document.querySelectorAll(".section");
menuItems.forEach(li => {
  li.addEventListener("click", () => {
    menuItems.forEach(i => i.classList.remove("active"));
    li.classList.add("active");
    sections.forEach(s => s.classList.add("hidden"));
    document.getElementById(li.dataset.section).classList.remove("hidden");
    document.getElementById("sectionTitle").textContent = li.textContent;
  });
});

// === Déconnexion ===
document.getElementById("logout").addEventListener("click", () => {
  localStorage.removeItem("myMirUser");
  window.location.href = "login.html";
});

// === Charger le profil utilisateur ===
async function loadProfile() {
  const user = JSON.parse(localStorage.getItem("myMirUser"));
  if (!user) return;
  const res = await fetch(`${API_BASE}/users?key=${ADMIN_KEY}`);
  const data = await res.json();
  const current = data.users.find(u => u.email === user.email);
  if (!current) return;
  const meta = current.metadata || {};
  document.getElementById("pCompany").textContent = meta.companyName || "—";
  document.getElementById("pManager").textContent = current.name || "—";
  document.getElementById("pEmail").textContent = current.email || "—";
  document.getElementById("pSector").textContent = meta.sector || "—";
  document.getElementById("pRevenue").textContent = meta.revenue || "—";
  document.getElementById("pEmployees").textContent = meta.employees || "—";
  document.getElementById("pCountry").textContent = meta.country || "—";
  document.getElementById("pCertifications").textContent = meta.certifications || "—";
}
loadProfile();

// === Animation sur cartes ===
document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("mousemove", e => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
  });
});
