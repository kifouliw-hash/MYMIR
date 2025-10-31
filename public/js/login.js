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
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log("📡 Réponse /login :", data);

      if (data.success && data.token) {
        console.log("🟢 Token reçu :", data.token);

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("✅ Connexion réussie :", data.user);

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

