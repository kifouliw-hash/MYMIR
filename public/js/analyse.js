// ===============================================
// 🔍 Gestion de l'analyse MyMír
// ===============================================
alert("✅ analyse.js est bien chargé !");
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ Script analyse.js chargé et DOM prêt");

  const uploadArea = document.getElementById("uploadArea");
  const resultBox = document.getElementById("resultBox");
  const fileInput = document.getElementById("fileInput");
  const chooseBtn = document.getElementById("chooseBtn");

  if (!fileInput || !uploadArea || !resultBox) {
    console.error("❌ Éléments DOM manquants dans analyse.html !");
    return;
  }

  // ✅ Bouton "Choisir un fichier"
  if (chooseBtn) {
    chooseBtn.addEventListener("click", () => {
      console.log("📂 Ouverture sélecteur de fichiers");
      fileInput.click();
    });
  }

  // ✅ Analyse du fichier sélectionné
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    uploadArea.innerHTML = `<p>📄 Analyse en cours de ${file.name}...</p>`;
    const formData = new FormData();
    formData.append("file", file);

    console.log("📤 Envoi du fichier à /analyze :", file.name);

    try {
      const response = await fetch(window.location.origin + "/analyze", {
        method: "POST",
        body: formData,
      });

      console.log("📥 Réponse brute :", response);

      const result = await response.json();
      console.log("📦 Résultat JSON :", result);

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
});