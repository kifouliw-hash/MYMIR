const apiBase = "https://mymir.on***REMOVED***";
const adminAccessPassword = "mir-admin-2025";

// === Sécurité d’accès ===
document.getElementById("unlockBtn").addEventListener("click", () => {
  const input = document.getElementById("accessPassword").value.trim();
  if (input === adminAccessPassword) {
    document.getElementById("lockScreen").style.display = "none";
    document.getElementById("adminPanel").style.display = "block";
    loadUsers();
  } else {
    alert("Mot de passe incorrect.");
  }
});

// === Chargement utilisateurs ===
async function loadUsers() {
  try {
    const res = await fetch(`${apiBase}/users?key=${adminAccessPassword}`);
    const data = await res.json();

    if (!data.success) {
      alert(data.message || "Erreur d'accès");
      return;
    }

    const tbody = document.querySelector("#usersTable tbody");
    tbody.innerHTML = "";
    document.getElementById("count").textContent = data.count;

    const countryCount = {};

    data.users.forEach(user => {
      const meta = user.metadata || {};
      const country = meta.country || "Inconnu";
      countryCount[country] = (countryCount[country] || 0) + 1;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.id}</td>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>${meta.companyName || "—"}</td>
        <td>${country}</td>
        <td>${meta.sector || "—"}</td>
        <td>${meta.revenue || "—"}</td>
        <td><button class="btn-delete" data-id="${user.id}">🗑️</button></td>
      `;
      tbody.appendChild(tr);
    });

    updateCharts(countryCount);

    document.querySelectorAll(".btn-delete").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const id = e.target.getAttribute("data-id");
        if (!confirm("Supprimer cet utilisateur ?")) return;

        const delRes = await fetch(`${apiBase}/users/${id}?key=${adminAccessPassword}`, { method: "DELETE" });
        const delData = await delRes.json();

        if (delData.success) {
          alert("Utilisateur supprimé !");
          loadUsers();
        } else {
          alert(delData.message || "Erreur suppression.");
        }
      });
    });

  } catch (err) {
    console.error(err);
    alert("Erreur de connexion au serveur.");
  }
}

document.getElementById("reloadBtn").addEventListener("click", loadUsers);

// === Export Excel ===
document.getElementById("exportBtn").addEventListener("click", () => {
  const wb = XLSX.utils.table_to_book(document.getElementById("usersTable"), { sheet: "Utilisateurs" });
  XLSX.writeFile(wb, "Utilisateurs_MyMir.xlsx");
});

// === Graphique pays ===
function updateCharts(countryCount) {
  const ctx = document.getElementById("countryChart");
  const labels = Object.keys(countryCount);
  const values = Object.values(countryCount);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Inscriptions par pays",
        data: values,
        backgroundColor: "rgba(250, 204, 21, 0.8)",
        borderColor: "#facc15",
        borderWidth: 2,
      }],
    },
    options: {
      animation: {
        duration: 1500,
        easing: "easeOutElastic",
      },
      scales: {
        x: { ticks: { color: "#fff" } },
        y: { ticks: { color: "#fff" } }
      },
      plugins: { legend: { display: false } },
    }
  });
}

