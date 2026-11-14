// Suggestions : validation côté navigateur (le serveur revalide), champ-piège, délai minimal, confirmation de réception.
(function () {
  var f = document.getElementById("suggestion");
  if (!f) { return; }
  var cfg = window.SN_CONFIG || {}, ouverture = Date.now(),
      indispo = document.getElementById("sugg-indispo"), statut = document.getElementById("sugg-statut"),
      bouton = document.getElementById("sugg-bouton");
  if (!cfg.suggestionsUrl) { indispo.hidden = false; bouton.disabled = true; bouton.setAttribute("aria-disabled", "true"); }

  function erreur(id, msg) {
    var p = document.getElementById("e-" + id), champ = document.getElementById(id);
    p.textContent = msg; p.hidden = !msg;
    if (msg) { champ.setAttribute("aria-invalid", "true"); } else { champ.removeAttribute("aria-invalid"); }
    return !msg;
  }
  function valide() {
    var d = f.description.value.trim(), c = f.courriel.value.trim(), ok = true, premier = null;
    function note(bon, el) { if (!bon) { ok = false; premier = premier || el; } }
    note(erreur("categorie", f.categorie.value ? "" : "Choisissez une catégorie."), f.categorie);
    note(erreur("description", d.length >= 10 && d.length <= 2000 ? "" : "Décrivez votre idée en 10 à 2 000 caractères."), f.description);
    note(erreur("courriel", c === "" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c) ? "" : "Cette adresse courriel ne semble pas valide."), f.courriel);
    if (premier) { premier.focus(); }
    return ok;
  }
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    statut.hidden = true; statut.className = "confirmation";
    if (!cfg.suggestionsUrl || !valide()) { return; }
    bouton.disabled = true;
    fetch(cfg.suggestionsUrl + "/api/v1/suggestions", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categorie: f.categorie.value, description: f.description.value.trim(), courriel: f.courriel.value.trim(),
                             site_web: f.site_web.value, delai_ms: Date.now() - ouverture })
    }).then(function (r) {
      if (!r.ok) { throw new Error("http " + r.status); }
      f.reset();
      statut.textContent = "Merci, votre suggestion a bien été reçue. Elle sera examinée ; nous ne pouvons ni garantir sa réalisation ni annoncer de délai.";
      statut.hidden = false; statut.focus && statut.setAttribute("tabindex", "-1"); statut.focus();
    }).catch(function () {
      statut.textContent = "Votre suggestion n'a pas pu être envoyée. Réessayez dans un moment ou écrivez à contact@sinenomine.app.";
      statut.className = "erreur"; statut.hidden = false;
    }).then(function () { bouton.disabled = false; });
  });
})();
