const apiBase = "https://mymir.onrender.com";
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

  if (window.countryChartInstance) {
    window.countryChartInstance.destroy(); // évite le cumul de graphes
  }

  window.countryChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels, // ✅ noms de pays
      datasets: [{
        label: "Inscriptions par pays",
        data: values,
        backgroundColor: labels.map(() => "rgba(250, 204, 21, 0.7)"),
        borderColor: "#facc15",
        borderWidth: 1.5,
        borderRadius: 6,
        hoverBackgroundColor: "#fde047"
      }]
    },
    options: {
      indexAxis: "y",
      scales: {
        x: {
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" }
        },
        y: {
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" }
        }
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: "Répartition des utilisateurs par pays",
          color: "#facc15",
          font: { size: 16, family: "Inter" }
        }
      },
      animation: {
        duration: 1500,
        easing: "easeOutElastic"
      }
    }
  });
}


