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
      // ✅ Utiliser l'URL absolue du backend sur Render
      const res = await fetch("https://mymir.on***REMOVED***/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // 🔑 pour garantir la bonne gestion des cookies & domaine
      });

      // ✅ Forcer la lecture JSON
      const data = await res.json();
      console.log("📡 Réponse /login :", data);

      // ✅ Vérifie que tout est bien reçu
      if (data && data.success && data.token) {
        console.log("🟢 Token reçu :", data.token);

        // ✅ Stockage persistant
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Connexion réussie 🎉");
        window.location.href = "app.html";
      } else {
        console.warn("⚠️ Réponse inattendue :", data);
        alert(data.message || "Erreur de connexion.");
      }
    } catch (err) {
      console.error("❌ Erreur réseau :", err);
      alert("Erreur serveur, veuillez réessayer.");
    }
  });
}
