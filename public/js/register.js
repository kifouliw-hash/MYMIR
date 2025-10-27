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
      helpText.textContent = "En France, le SIRET permet d'auto-remplir vos informations via data.gouv.fr.";
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

// === 🔍 Auto-remplissage via API SIRET ===
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

      // ✅ Auto-remplissage
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

// === 🚀 Création de compte réelle (connexion Render PostgreSQL) ===
const form = document.getElementById("registerForm");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = form.querySelector("button[type='submit']");
    btn.textContent = "Création du compte...";
    btn.disabled = true;

    const managerName = document.getElementById("managerName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    const companyId = document.getElementById("companyId").value.trim();
    const companyName = document.getElementById("companyName").value.trim();
    const sector = document.getElementById("sector").value;
    const revenue = document.getElementById("revenue").value;
    const employees = document.getElementById("employees").value;
    const country = document.getElementById("country").value;
    const certifications = document.getElementById("certifications").value.trim();

    if (!managerName || !email || !password) {
      alert("Veuillez remplir les champs essentiels : nom, email, mot de passe.");
      btn.textContent = "Créer le compte";
      btn.disabled = false;
      return;
    }

    try {
      const response = await fetch("https://mymir.onrender.com/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: managerName,
          email,
          password,
          metadata: {
            companyId,
            companyName,
            sector,
            revenue,
            employees,
            country,
            certifications
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        btn.textContent = "Compte créé ✅";
        btn.style.background = "#4ADE80";
        localStorage.setItem("myMirUser", JSON.stringify(data.user));
        setTimeout(() => (window.location.href = "login.html"), 1000);
      } else {
        alert(data.message || "Erreur lors de la création du compte.");
        btn.textContent = "Créer le compte";
        btn.disabled = false;
      }

    } catch (error) {
      console.error("❌ Erreur réseau :", error);
      alert("Impossible de se connecter au serveur.");
      btn.textContent = "Créer le compte";
      btn.disabled = false;
    }
  });
}
