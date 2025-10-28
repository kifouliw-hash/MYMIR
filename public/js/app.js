// 🌐 BACKEND CONFIG
const API_BASE = "https://mymir.on***REMOVED***";
const ADMIN_KEY = "mir-admin-2025";

// ===============================
// 🎨 EFFET DE FOND DYNAMIQUE
// ===============================
const canvas = document.getElementById("bgCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let waveOffset = 0;
function drawWave() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, "#ffe259");
  gradient.addColorStop(1, "#ffa751");
  ctx.fillStyle = gradient;

  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  for (let x = 0; x < canvas.width; x++) {
    const y = Math.sin((x + waveOffset) * 0.01) * 20 + canvas.height / 2;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();

  waveOffset += 2;
  requestAnimationFrame(drawWave);
}
drawWave();

// ===============================
// ⚙️ NAVIGATION ENTRE SECTIONS
// ===============================
const sections = document.querySelectorAll(".section");
document.querySelectorAll("aside nav li").forEach(btn => {
  btn.addEventListener("click", () => {
    sections.forEach(s => s.classList.add("hidden"));
    const target = btn.id.replace("Btn", "");
    document.getElementById(target).classList.remove("hidden");
    document.getElementById("pageTitle").textContent = btn.textContent.trim();
  });
});

// ===============================
// 👤 PROFIL UTILISATEUR
// ===============================
async function loadUserProfile() {
  const user = JSON.parse(localStorage.getItem("myMirUser"));
  if (!user || !user.email) return;

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
loadUserProfile();

// ===============================
// 🚪 DÉCONNEXION
// ===============================
document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("myMirUser");
  window.location.href = "login.html";
});

// ===============================
// 📊 CHART D'ANALYSE (simulé pour test)
// ===============================
const analyseCanvas = document.getElementById("analyseChart");
if (analyseCanvas) {
  new Chart(analyseCanvas, {
    type: "doughnut",
    data: {
      labels: ["Techniques", "Financières", "Administratives"],
      datasets: [{
        data: [45, 35, 20],
        backgroundColor: ["#ffd700", "#ff9f43", "#48dbfb"],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom", labels: { color: "#fff" } },
        title: {
          display: true,
          text: "Répartition des critères d’analyse",
          color: "#fff"
        }
      }
    }
  });
}
