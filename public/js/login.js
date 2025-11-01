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
      const res = await fetch("https://mymir.onrender.com/login", {
  method: "POST",
  credentials: "include", // ✅ ici aussi
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
});

      const data = await res.json();
      console.log("📡 Réponse /login :", data);

      if (data.success && data.token) {
        console.log("🟢 Token reçu :", data.token);

        try {
          // ✅ Stockage local normal
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          console.log("✅ Token sauvegardé dans localStorage");
        } catch (e) {
          // ⚠️ Safari ou mode privé → fallback cookie
          console.warn("⚠️ localStorage bloqué, utilisation d’un cookie de secours :", e);
          document.cookie = `token=${data.token}; path=/; max-age=7200; Secure; SameSite=None`;
        }

        alert("Connexion réussie 🎉");
        window.location.href = "app.html";
      } else {
        alert(data.message || "Erreur de connexion.");
      }
    } catch (err) {
      console.error("❌ Erreur serveur :", err);
      alert("Erreur serveur, veuillez réessayer.");
    }
  });
}