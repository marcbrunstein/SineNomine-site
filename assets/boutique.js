// Achat : vérification des cases, puis demande de session de paiement au serveur. Aucune clé de paiement ici.
(function () {
  var f = document.getElementById("achat");
  if (!f) { return; }
  var cfg = window.SN_CONFIG || {}, indispo = document.getElementById("achat-message"),
      erreur = document.getElementById("achat-erreur"), bouton = document.getElementById("achat-bouton");
  var en = document.documentElement.lang === "en";
  var M = en ? {
    cases: "Tick both boxes to continue: licence per computer, non-transferable, and the conditions of sale.",
    postes: "Enter a number of seats between 1 and 100.",
    profil: "Choose whether you are buying as an individual or as a business.",
    retractation: "Individuals: tick the box requesting immediate access and acknowledging the loss of your right of withdrawal.",
    echec: "The payment could not be started. Nothing has been charged. Try again in a moment or write to contact@sinenomine.app."
  } : {
    cases: "Cochez les deux cases pour continuer : licence par ordinateur, non transférable, et conditions de vente.",
    postes: "Indiquez un nombre de postes compris entre 1 et 100.",
    profil: "Indiquez si vous achetez en tant que particulier ou en tant qu'entreprise.",
    retractation: "Particuliers : cochez la case demandant l'accès immédiat et reconnaissant la perte du droit de rétractation.",
    echec: "Le paiement n'a pas pu être démarré. Aucun montant n'a été débité. Réessayez dans un moment ou écrivez à contact@sinenomine.app."
  };
  function montre(msg) { erreur.textContent = msg; erreur.hidden = !msg; }

  // Licences groupées (édition Expert) : nombre de postes et total HT indicatif. Le prix réellement facturé est celui de la page de paiement,
  // calculé par le serveur ; ici, le tarif de lancement ne s'applique que si la date de fin est connue et non dépassée.
  var blocPostes = document.getElementById("postes-bloc"), champPostes = document.getElementById("postes"), total = document.getElementById("total-ht");
  function nombrePostes() {
    var n = Number(champPostes.value);
    return (champPostes.value !== "" && n >= 1 && n <= 100 && Math.floor(n) === n) ? n : null;
  }
  function prixParPoste() {
    var fin = f.getAttribute("data-fin-lancement"), jour = new Date().toISOString().slice(0, 10);
    return (fin && jour <= fin) ? Number(f.getAttribute("data-prix-lancement")) : Number(f.getAttribute("data-prix-normal"));
  }
  function majPostes() {
    var entreprise = f.profil.value === "entreprise";
    blocPostes.hidden = !entreprise;
    if (!entreprise) { return; }
    var n = nombrePostes(), fin = f.getAttribute("data-fin-lancement");
    if (n === null) { total.textContent = ""; return; }
    if (!fin) { total.textContent = en ? "The total is calculated on the payment page." : "Le total est calculé sur la page de paiement."; return; }
    var t = n * prixParPoste();
    total.textContent = en ? ("Total: " + n + " × €" + prixParPoste() + " = €" + t + " excl. VAT.") : ("Total : " + n + " × " + prixParPoste() + " € = " + t + " € HT.");
  }
  Array.prototype.forEach.call(f.querySelectorAll("input[name=profil]"), function (r) { r.addEventListener("change", majPostes); });
  if (champPostes) { champPostes.addEventListener("input", majPostes); }
  majPostes();
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    montre("");
    // Boutique pas encore ouverte : même mention que « Payer en bitcoin ».
    if (!cfg.boutiqueUrl) { indispo.hidden = false; return; }
    indispo.hidden = true;
    var profil = f.profil.value;
    if (!profil) { montre(M.profil); f.profil[0].focus(); return; }
    if (!f.licence.checked || !f.cgv.checked) {
      montre(M.cases);
      (f.licence.checked ? f.cgv : f.licence).focus();
      return;
    }
    if (profil === "particulier" && !f.retractation.checked) { montre(M.retractation); f.retractation.focus(); return; }
    var postes = 1;
    if (profil === "entreprise") { postes = nombrePostes(); if (postes === null) { montre(M.postes); champPostes.focus(); return; } }
    bouton.disabled = true;
    fetch(cfg.boutiqueUrl + "/api/v1/commandes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profil: profil, postes: postes, langue: en ? "en" : "fr", licence_ordinateur_unique: true, conditions_acceptees: true,
        renonciation_retractation: profil === "particulier" ? f.retractation.checked : false })
    }).then(function (r) {
      if (!r.ok) { throw new Error("http " + r.status); }
      return r.json();
    }).then(function (d) {
      // Seule une adresse de paiement https est suivie ; la licence n'est jamais délivrée par cette page.
      if (!d || typeof d.url !== "string" || d.url.indexOf("https://") !== 0) { throw new Error("réponse invalide"); }
      window.location.assign(d.url);
    }).catch(function () {
      bouton.disabled = false;
      montre(M.echec);
    });
  });

  // « Payer en bitcoin » : option pas encore disponible. On affiche le message et, si le serveur est configuré, on signale
  // le clic de façon anonyme (aucun identifiant, aucune donnée personnelle) pour mesurer l'intérêt.
  var btc = document.getElementById("btc-bouton"), msg = document.getElementById("btc-message");
  if (btc && msg) {
    btc.addEventListener("click", function () {
      msg.hidden = false;
      if (cfg.boutiqueUrl) {
        try {
          fetch(cfg.boutiqueUrl + "/api/v1/interet-bitcoin", { method: "POST", headers: { "Content-Type": "application/json" },
            body: "{}", keepalive: true }).catch(function () {});
        } catch (e) { /* sans effet : le message reste affiché */ }
      }
    });
  }
})();
