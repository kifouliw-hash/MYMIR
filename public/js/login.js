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

if (data.success) {
  console.log("✅ Connexion réussie via cookie pour :", data.user.email);

  // ⚡️ Utilise une redirection différée (Safari safe)
  alert("Connexion réussie 🎉");

  setTimeout(() => {
    window.location.replace("app.html");
  }, 200);
} else {
  alert(data.message || "Erreur de connexion.");
}
    } catch (err) {
      console.error("❌ Erreur serveur :", err);
      alert("Erreur serveur, veuillez réessayer.");
    }
  });
}