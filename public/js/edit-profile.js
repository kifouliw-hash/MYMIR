document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const res = await fetch("/api/user", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const user = await res.json();

  document.getElementById("companyName").value = user.metadata?.companyName || "";
  document.getElementById("sector").value = user.metadata?.sector || "";
  document.getElementById("country").value = user.metadata?.country || "";
  document.getElementById("effectif").value = user.metadata?.effectif || "";
  document.getElementById("certifications").value = user.metadata?.certifications || "";
  document.getElementById("siteWeb").value = user.metadata?.siteWeb || "";
  document.getElementById("turnover").value = user.metadata?.turnover || "";

  document.getElementById("editProfileForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const data = {
      companyName: document.getElementById("companyName").value,
      sector: document.getElementById("sector").value,
      country: document.getElementById("country").value,
      effectif: document.getElementById("effectif").value,
      certifications: document.getElementById("certifications").value,
      siteWeb: document.getElementById("siteWeb").value,
      turnover: document.getElementById("turnover").value,
    };

    const res = await fetch("/api/update-profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();
    if (result.success) {
      alert("✅ Profil mis à jour avec succès !");
      window.location.href = "app.html";
    } else {
      alert("❌ Erreur lors de la mise à jour du profil.");
    }
  });
});