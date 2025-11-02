// === Apparition fluide des champs ===
document.querySelectorAll('input, select, button').forEach((el, i) => {
  el.style.opacity = 0;
  setTimeout(() => {
    el.style.transition = "opacity 0.4s ease";
    el.style.opacity = 1;
  }, i * 80);
});

// === 🚀 Création de compte réelle ===
const form = document.getElementById("registerForm");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = form.querySelector("button[type='submit']");
    btn.textContent = "Création du compte...";
    btn.disabled = true;

    const API_BASE = window.location.origin;

    const data = {
  companyName: document.getElementById("companyName").value.trim(),
  managerName: document.getElementById("managerName").value.trim(),
  email: document.getElementById("email").value.trim(),
  sector: document.getElementById("sector").value,
  revenue: document.getElementById("revenue") ? document.getElementById("revenue").value : "",
  employees: document.getElementById("employees").value,
  country: document.getElementById("country").value,
  certifications: document.getElementById("certifications").value.trim(),
  description: document.getElementById("description").value.trim(), // 👈 AJOUT ICI
  password: document.getElementById("password").value.trim(),
};

    if (!data.managerName || !data.email || !data.password) {
      alert("Veuillez remplir au minimum le nom, l’email et le mot de passe.");
      btn.textContent = "Créer le compte";
      btn.disabled = false;
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      console.log("🧠 Réponse backend :", result);

      if (response.ok && result.success) {
        btn.textContent = "Compte créé ✅";
        btn.style.background = "#4ADE80";
        alert("✅ Compte créé avec succès !");

        // 🔁 Attendre une demi-seconde avant redirection (Safari safe)
        setTimeout(() => {
          window.location.href = "app.html";
        }, 800);
      } else {
        alert(result.message || "Erreur lors de la création du compte.");
        btn.textContent = "Créer le compte";
        btn.disabled = false;
      }
    } catch (err) {
      console.error("❌ Erreur réseau :", err);
      alert("Erreur de connexion au serveur.");
      btn.textContent = "Créer le compte";
      btn.disabled = false;
    }
  });
}