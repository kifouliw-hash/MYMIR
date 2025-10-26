document.getElementById("uploadForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("fileInput");
  const resultBox = document.getElementById("result");
  const output = document.getElementById("analysisOutput");

  if (!fileInput.files.length) {
    alert("Veuillez choisir un fichier avant de lancer l'analyse.");
    return;
  }

  const file = fileInput.files[0];
  output.textContent = `Analyse en cours du fichier : ${file.name}...`;

  // Simulation d'analyse
  setTimeout(() => {
    output.textContent = `✅ Analyse terminée.\n
    Nom du fichier : ${file.name}\n
    Type : ${file.type || 'Inconnu'}\n
    Taille : ${(file.size / 1024).toFixed(2)} Ko\n
    Résumé : Ce document semble contenir des informations exploitables.`;
    resultBox.classList.remove("hidden");
  }, 2000);
});