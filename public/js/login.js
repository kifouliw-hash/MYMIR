 // ==========================
// 🔐 Connexion MyMír (Frontend)
// ==========================

const form = document.getElementById("loginForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    try {
      const res = await fetch("https://mymir.on***REMOVED***/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("📡 Réponse /login :", data);

      // ✅ Si le serveur renvoie le token
      if (data.success && data.token) {
        console.log("🟢 Token reçu :", data.token);

        // 🔒 Stockage local (fonctionne même sur Safari)
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Connexion réussie 🎉");
        console.log("➡️ Redirection vers app.html...");

        // 🕐 Petit délai pour Safari avant la redirection
        setTimeout(() => {
          window.location.href = "app.html";
        }, 300);
      } else {
        alert(data.message || "Erreur de connexion.");
      }
    } catch (err) {
      console.error("❌ Erreur serveur :", err);
      alert("Erreur serveur, veuillez réessayer.");
    }
  });
}