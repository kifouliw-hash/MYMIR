// ===============================================
// 🔍 Analyse MyMír
// ===============================================

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Session expirée ou inexistante. Veuillez vous reconnecter.");
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("https://mymir.onrender.com/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) {
      alert("Session expirée. Veuillez vous reconnecter.");
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    console.log("✅ Utilisateur vérifié :", data.user);
    document.getElementById("companyName").textContent =
      data.user.metadata?.companyName || data.user.name || "Entreprise";
  } catch (err) {
    console.error("⚠️ Erreur auth :", err);
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }

  // ===============================================
  // 📂 Gestion de l’analyse
  // ===============================================
  const uploadArea = document.getElementById("uploadArea");
  const resultBox = document.getElementById("resultBox");
  const fileInput = document.getElementById("fileInput");
  const chooseBtn = document.getElementById("chooseBtn");

  if (!uploadArea || !fileInput) {
    console.error("❌ Éléments manquants dans analyse.html !");
    return;
  }

  if (chooseBtn) {
    chooseBtn.addEventListener("click", () => fileInput.click());
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    if (!file) return;

    uploadArea.innerHTML = `<p>📄 Analyse en cours de ${file.name}...</p>`;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${window.location.origin}/analyze`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      console.log("📦 Résultat analyse :", result);

      if (result.success) {
        uploadArea.style.display = "none";
        resultBox.classList.remove("hidden");
        resultBox.innerHTML = `
          <h3>🧠 Résultat de l’analyse</h3>
          <pre style="white-space: pre-wrap;">${result.analysis}</pre>
          <button class="analysis-btn" onclick="window.location.reload()">🔁 Nouvelle analyse</button>`;
      } else {
        uploadArea.innerHTML = `<p>❌ Erreur : ${result.message}</p>`;
      }
    } catch (err) {
      console.error("❌ Erreur réseau :", err);
      uploadArea.innerHTML = `<p>⚠️ Erreur lors de l’analyse.</p>`;
    }
  });
});