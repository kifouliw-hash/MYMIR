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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("📡 Réponse /login :", data);

      if (data.success && data.token) {
        console.log("🟢 Token reçu :", data.token.substring(0, 20) + "...");

        // ✅ Stockage du token et de l'utilisateur
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        alert("Connexion réussie 🎉 Redirection en cours...");

        // 🕐 Délai légèrement augmenté pour Safari
        setTimeout(() => {
          console.log("➡️ Redirection vers app.html");
          window.location.href = "app.html";
        }, 800); // ⬅️ augmente un peu le temps pour fiabiliser l’écriture
      } else {
        alert(data.message || "Erreur de connexion.");
      }
    } catch (err) {
      console.error("❌ Erreur serveur :", err);
      alert("Erreur serveur, veuillez réessayer.");
    }
  });
}