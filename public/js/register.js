// Animation d'apparition progressive
document.querySelectorAll('input, select, button').forEach((el, i) => {
  el.style.opacity = 0;
  setTimeout(() => {
    el.style.transition = "opacity 0.4s ease";
    el.style.opacity = 1;
  }, i * 100);
});

// Feedback visuel sur clic
document.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.textContent = "Création du compte...";
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = "Compte créé ✅";
    btn.style.background = "#4ADE80";
  }, 1500);
});
