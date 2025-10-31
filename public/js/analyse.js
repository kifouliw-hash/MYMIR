// ===============================================
// 🔍 Gestion du chargement et de l’analyse
// ===============================================

const uploadArea = document.getElementById("uploadArea");
const resultBox = document.getElementById("resultBox");
const fileInput = document.getElementById("fileInput");

// ✅ Attache une seule fois le listener
fileInput.addEventListener("change", async () => {
  const file = fileInput.files[0];
  if (!file) return;

  uploadArea.innerHTML = `<p>📄 Analyse en cours de ${file.name}...</p>`;
  const formData = new FormData();
  formData.append("file", file);
  console.log("📤 Envoi du fichier à /analyze :", file.name);

  try {
    const response = await fetch("/analyze", {
      method: "POST",
      body: formData,
    });
    console.log("📥 Réponse brute :", response);

    const result = await response.json();

    if (result.success) {
      uploadArea.style.display = "none";
      resultBox.classList.remove("hidden");
      resultBox.innerHTML = `
        <h3>🧠 Résultat de l’analyse</h3>
        <pre style="white-space: pre-wrap;">${result.analysis}</pre>
        <div class="analysis-btns">
          <button class="analysis-btn" onclick="window.location.reload()">🔁 Nouvelle analyse</button>
        </div>`;
    } else {
      uploadArea.innerHTML = `<p>❌ Erreur : ${result.message}</p>`;
    }
  } catch (err) {
    console.error("❌ Erreur réseau :", err);
    uploadArea.innerHTML = `<p>⚠️ Erreur de connexion au serveur.</p>`;
  }
});
