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
      // ✅ Chemin absolu (Render)
      const res = await fetch("https://mymir.on***REMOVED***/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("📡 Réponse /login :", data);

      if (data.success && data.token) {
        // ✅ Stocker le token JWT pour garder la session
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Connexion réussie !");
        window.location.href = "app.html"; // Redirige vers ton tableau de bord
      } else {
        alert(data.message || "Erreur de connexion.");
      }
    } catch (err) {
      console.error("❌ Erreur serveur :", err);
      alert("Erreur serveur, veuillez réessayer.");
    }
  });
}
