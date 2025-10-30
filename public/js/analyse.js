const fileInput = document.getElementById("fileInput");
const uploadArea = document.getElementById("uploadArea");
const resultBox = document.getElementById("resultBox");

// Détection du choix de fichier
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  uploadArea.innerHTML = `<p>📄 Analyse en cours de ${file.name}...</p>`;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (result.success) {
      uploadArea.style.display = "none";
      resultBox.classList.remove("hidden");
      resultBox.innerHTML = `
        <h3>🧠 Résultat de l’analyse</h3>
        <pre style="white-space:pre-wrap;">${result.analysis}</pre>
        <div class="analysis-btns">
          <button class="analysis-btn" onclick="resetAnalysis()">🔁 Nouvelle analyse</button>
        </div>
      `;
    } else {
      uploadArea.innerHTML = `<p>❌ Erreur : ${result.message}</p>`;
    }
  } catch (error) {
    console.error("Erreur:", error);
    uploadArea.innerHTML = `<p>❌ Erreur de connexion au serveur.</p>`;
  }
});

function resetAnalysis() {
  resultBox.classList.add("hidden");
  uploadArea.style.display = "block";
  uploadArea.innerHTML = `
    <p>Glissez votre dossier DCE ici ou cliquez pour le sélectionner.</p>
    <input type="file" id="fileInput" accept=".pdf,.doc,.docx" hidden />
    <button class="analysis-btn" onclick="document.getElementById('fileInput').click()">
      Choisir un fichier
    </button>
  `;
  document.getElementById("fileInput").addEventListener("change", async () => {
  const newFile = document.getElementById("fileInput").files[0];
  if (newFile) {
    uploadArea.innerHTML = `<p>📄 Analyse en cours de ${newFile.name}...</p>`;
    const formData = new FormData();
    formData.append("file", newFile);
    const response = await fetch("/analyze", { method: "POST", body: formData });
    const result = await response.json();
    if (result.success) {
      uploadArea.style.display = "none";
      resultBox.classList.remove("hidden");
      resultBox.innerHTML = `
        <h3>🧠 Résultat de l’analyse</h3>
        <pre style="white-space:pre-wrap;">${result.analysis}</pre>
        <div class="analysis-btns">
          <button class="analysis-btn" onclick="resetAnalysis()">🔁 Nouvelle analyse</button>
        </div>`;
    } else {
      uploadArea.innerHTML = `<p>❌ Erreur : ${result.message}</p>`;
    }
  }
});
}
