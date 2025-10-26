// =============================
//  Navigation dynamique
// =============================
const links = document.querySelectorAll(".sidebar nav a");
const contentArea = document.getElementById("contentArea");
const pageTitle = document.getElementById("pageTitle");

links.forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    links.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
    const page = link.getAttribute("data-page");
    loadPage(page);
  });
});

function loadPage(page) {
  pageTitle.textContent = page.charAt(0).toUpperCase() + page.slice(1);

  if (page === "dashboard") {
    contentArea.innerHTML = `
      <div class="welcome">
        <h2>Bienvenue sur votre tableau de bord</h2>
        <p>Sélectionnez un module pour commencer votre analyse.</p>
      </div>`;
  }

  if (page === "analyse") {
    contentArea.innerHTML = `
      <div class="module">
        <h2>Module d'analyse intelligente</h2>
        <p>Importez un appel d'offre (PDF) pour lancer l'analyse.</p>
        <input type="file" id="fileInput" accept=".pdf" />
        <button onclick="startAnalyse()">Analyser</button>
        <div id="analyseResult"></div>
      </div>`;
  }

  if (page === "aide") {
    contentArea.innerHTML = `
      <div class="module">
        <h2>Aide à la réponse</h2>
        <p>Recommandations IA pour rédiger vos dossiers d'appel d'offre.</p>
      </div>`;
  }

  if (page === "historique") {
    contentArea.innerHTML = `
      <div class="module">
        <h2>Historique</h2>
        <p>Visualisez les analyses et dossiers précédents.</p>
      </div>`;
  }

  if (page === "profil") {
    contentArea.innerHTML = `
      <div class="module">
        <h2>Profil de l'entreprise</h2>
        <p>Nom : <strong>Entreprise Démo</strong></p>
        <p>Statut : <strong>Compte gratuit</strong></p>
      </div>`;
  }
}

// Simule le logout
document.getElementById("logoutBtn").addEventListener("click", () => {
  alert("Déconnexion réussie !");
  window.location.href = "index.html";
});

// Simulation d’analyse (placeholder)
function startAnalyse() {
  const result = document.getElementById("analyseResult");
  result.innerHTML = "<p>Analyse en cours...</p>";
  setTimeout(() => {
    result.innerHTML = `
      <h3>Résultats :</h3>
      <ul>
        <li>Type de marché : Fourniture de services</li>
        <li>Date limite : 18/11/2025</li>
        <li>Documents requis : DC1, DC2, Mémoire technique</li>
      </ul>`;
  }, 2000);
}
