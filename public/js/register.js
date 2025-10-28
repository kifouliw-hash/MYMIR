// === Apparition fluide des champs ===
document.querySelectorAll('input, select, button').forEach((el, i) => {
  el.style.opacity = 0;
  setTimeout(() => {
    el.style.transition = "opacity 0.4s ease";
    el.style.opacity = 1;
  }, i * 80);
});

// === Gestion du pays et du champ identifiant ===
const countrySelect = document.getElementById("country");
const companyIdLabel = document.getElementById("companyIdLabel");
const autoFillBtn = document.getElementById("autoFillBtn");
const helpText = document.getElementById("helpText");

if (countrySelect) {
  countrySelect.addEventListener("change", () => {
    const country = countrySelect.value;
    if (country === "France") {
      companyIdLabel.textContent = "SIRET (France)";
      autoFillBtn.style.display = "inline-block";
      helpText.textContent =
        "En France, le SIRET permet d'auto-remplir vos informations via data.gouv.fr.";
    } else if (country === "Belgique") {
      companyIdLabel.textContent = "Numéro d’entreprise (BCE)";
      autoFillBtn.style.display = "none";
      helpText.textContent = "Saisissez votre numéro BCE (sans espaces).";
    } else {
      companyIdLabel.textContent = "Identifiant entreprise / N° fiscal";
      autoFillBtn.style.display = "none";
      helpText.textContent = "Saisissez manuellement les informations de votre entreprise.";
    }
  });
}

// === 🔍 Auto-remplissage via API SIRET (optionnel) ===
const companyIdInput = document.getElementById("companyId");
if (autoFillBtn) {
  autoFillBtn.addEventListener("click", async () => {
    const siret = companyIdInput.value.trim();
    if (!siret || siret.length !== 14) {
      alert("Veuillez entrer un SIRET valide (14 chiffres).");
      return;
    }

    autoFillBtn.textContent = "Recherche...";
    autoFillBtn.disabled = true;

    try {
      const response = await fetch("/api/siret/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siret }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Erreur serveur");

      document.getElementById("companyName").value = data.company || "";
      document.getElementById("country").value = data.country || "France";
      document.getElementById("certifications").value = `Code NAF : ${data.naf || "—"}`;
      alert("✅ Informations d’entreprise récupérées !");
    } catch (err) {
      alert("Impossible de trouver ce SIRET.");
      console.error(err);
    } finally {
      autoFillBtn.textContent = "Auto-remplir";
      autoFillBtn.disabled = false;
    }
  });
}

// === 🚀 Création de compte réelle (Render PostgreSQL + auto login) ===
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
      revenue: document.getElementById("revenue").value,
      employees: document.getElementById("employees").value,
      country: document.getElementById("country").value,
      certifications: document.getElementById("certifications").value.trim(),
      password: document.getElementById("password").value.trim(),
    };

    if (!data.managerName || !data.email || !data.password) {
      alert("Veuillez remplir au minimum le nom, l’email et le mot de passe.");
      btn.textContent = "Créer le compte";
      btn.disabled = false;
      return;
    }

    if (data.password.length < 6) {
      alert("Le mot de passe doit contenir au moins 6 caractères.");
      btn.textContent = "Créer le compte";
      btn.disabled = false;
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        // ✅ Si le backend renvoie un token (cas futur)
        if (result.token) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("user", JSON.stringify(result.user));
          alert("✅ Compte créé et connecté !");
          window.location.href = "app.html";
        } else {
          // Sinon redirige vers login classique
          alert("✅ Compte créé avec succès !");
          setTimeout(() => (window.location.href = "login.html"), 800);
        }

        btn.textContent = "Compte créé ✅";
        btn.style.background = "#4ADE80";
      } else {
        alert(result.message || "Erreur lors de l’inscription.");
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
