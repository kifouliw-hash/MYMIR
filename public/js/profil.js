// ===============================
// 👤 PROFIL UTILISATEUR — MyMír
// ===============================

window.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const res = await fetch("https://mymir.onrender.com/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();

    if (data.success) {
      const user = data.user;

      // Affichage dynamique
      document.querySelector(".sidebar-company").textContent =
        user.metadata.companyName || "Entreprise";
      document.getElementById("emailField").textContent = user.email;
      document.getElementById("countryField").textContent =
        user.metadata.country || "—";
      document.getElementById("sectorField").textContent =
        user.metadata.sector || "—";
    } else {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  } catch (err) {
    console.error("Erreur profil:", err);
    localStorage.removeItem("token");
    window.location.href = "login.html";
  }
});
