// Achat : vérification des cases, puis demande de session de paiement au serveur. Aucune clé de paiement ici.
(function () {
  var f = document.getElementById("achat");
  if (!f) { return; }
  var cfg = window.SN_CONFIG || {}, indispo = document.getElementById("achat-message"),
      erreur = document.getElementById("achat-erreur"), bouton = document.getElementById("achat-bouton");
  var en = document.documentElement.lang === "en";
  var M = en ? {
    cases: "Tick both boxes to continue: licence for one computer only, non-transferable, and the conditions of sale.",
    profil: "Choose whether you are buying as an individual or as a business.",
    retractation: "Individuals: tick the box requesting immediate access and acknowledging the loss of your right of withdrawal.",
    echec: "The payment could not be started. Nothing has been charged. Try again in a moment or write to contact@sinenomine.app."
  } : {
    cases: "Cochez les deux cases pour continuer : licence pour un seul ordinateur, non transférable, et conditions de vente.",
    profil: "Indiquez si vous achetez en tant que particulier ou en tant qu'entreprise.",
    retractation: "Particuliers : cochez la case demandant l'accès immédiat et reconnaissant la perte du droit de rétractation.",
    echec: "Le paiement n'a pas pu être démarré. Aucun montant n'a été débité. Réessayez dans un moment ou écrivez à contact@sinenomine.app."
  };
  function montre(msg) { erreur.textContent = msg; erreur.hidden = !msg; }
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
    bouton.disabled = true;
    fetch(cfg.boutiqueUrl + "/api/v1/commandes", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profil: profil, langue: en ? "en" : "fr", licence_ordinateur_unique: true, conditions_acceptees: true,
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
