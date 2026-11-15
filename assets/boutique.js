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

  // Édition, nombre de postes et récapitulatif. Les prix viennent des attributs du formulaire (mêmes valeurs que la boutique) ;
  // le montant réellement facturé est celui de la page de paiement, calculé par le serveur.
  var blocPostes = document.getElementById("postes-bloc"), champPostes = document.getElementById("postes"), recap = document.getElementById("recap-liste");
  var PRIX_STANDARD = 49, PRIX_LANCEMENT = Number(f.getAttribute("data-prix-lancement")), PRIX_NORMAL = Number(f.getAttribute("data-prix-normal")),
      FIN = f.getAttribute("data-fin-lancement");
  // Jour courant à Paris (le tarif de lancement s'arrête à minuit, heure de Paris). SN_DATE_TEST sert aux vérifications : « AAAA-MM-JJ ».
  function jourParis() {
    if (window.SN_DATE_TEST) { return window.SN_DATE_TEST; }
    try {
      return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    } catch (e) { return new Date().toISOString().slice(0, 10); }
  }
  function lancement() { return !!FIN && jourParis() <= FIN; }
  function prixParPoste() { return lancement() ? PRIX_LANCEMENT : PRIX_NORMAL; }
  function dateLongue(iso) {
    try {
      return new Intl.DateTimeFormat(en ? "en-GB" : "fr-FR", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso + "T00:00:00Z"));
    } catch (e) { return iso; }
  }
  function nombrePostes() {
    var n = Number(champPostes.value);
    return (champPostes.value !== "" && n >= 1 && n <= 100 && Math.floor(n) === n) ? n : null;
  }
  // Après l'échéance, les mentions du tarif de lancement disparaissent de la page (cartes comprises).
  function majTarifAffiche() {
    var actif = lancement();
    Array.prototype.forEach.call(document.querySelectorAll("[data-prix-expert]"), function (e) { e.textContent = String(prixParPoste()); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-lancement]"), function (e) { e.hidden = !actif; });
    if (!actif && FIN) {
      Array.prototype.forEach.call(document.querySelectorAll("[data-phrase-tarif]"), function (e) {
        e.textContent = en ? ("€" + PRIX_NORMAL + " per seat, excluding VAT.") : (PRIX_NORMAL + " € HT par poste.");
      });
    }
  }
  function ligne(terme, valeur) {
    var d = document.createElement("div"), dt = document.createElement("dt"), dd = document.createElement("dd");
    dt.textContent = terme; dd.textContent = valeur; d.appendChild(dt); d.appendChild(dd);
    return d;
  }
  function majRecap() {
    if (!recap) { return; }
    var profil = f.profil.value, L = [];
    if (!profil) {
      L.push([en ? "Edition" : "Édition", en ? "Choose an edition above." : "Choisissez une édition ci-dessus."]);
    } else if (profil === "particulier") {
      L.push([en ? "Edition" : "Édition", en ? "Standard, personal use" : "Standard, usage personnel"]);
      L.push([en ? "Computers" : "Ordinateurs", en ? "1 computer" : "1 ordinateur"]);
      L.push([en ? "Price" : "Prix", en ? ("€" + PRIX_STANDARD + " incl. VAT") : (PRIX_STANDARD + " € TTC")]);
      L.push([en ? "Total" : "Total", en ? ("€" + PRIX_STANDARD + " incl. VAT") : (PRIX_STANDARD + " € TTC")]);
      L.push([en ? "VAT" : "TVA", en ? "Included, at the rate of your country (confirmed on the payment page)." : "Incluse, au taux de votre pays (confirmé sur la page de paiement)."]);
      L.push([en ? "Your key" : "Votre clé", en ? "Emailed to the address entered at payment, once the payment is verified." : "Envoyée par courriel à l'adresse saisie lors du paiement, après vérification du paiement."]);
    } else {
      var n = nombrePostes(), p = prixParPoste();
      L.push([en ? "Edition" : "Édition", (en ? "Expert, professional use" : "Expert, usage professionnel") +
        (lancement() ? (en ? " (launch price through " + dateLongue(FIN) + ")" : " (tarif de lancement jusqu'au " + dateLongue(FIN) + " inclus)") : "")]);
      L.push([en ? "Seats" : "Postes", n === null ? M.postes : (en ? (n + (n > 1 ? " seats" : " seat")) : (n + (n > 1 ? " postes" : " poste")))]);
      L.push([en ? "Unit price" : "Prix unitaire", en ? ("€" + p + " per seat, excluding VAT") : (p + " € HT par poste")]);
      L.push([en ? "Subtotal" : "Sous-total", n === null ? "—" :
        (en ? (n + (n > 1 ? " seats" : " seat") + " × €" + p + " = €" + (n * p) + " excl. VAT") : (n + (n > 1 ? " postes" : " poste") + " × " + p + " € HT = " + (n * p) + " € HT"))]);
      L.push([en ? "VAT" : "TVA", en ? "Added to the subtotal: 20% in France; reverse charge in another EU country with a valid VAT number. The final amount is calculated on the payment page (Stripe)."
        : "En sus du sous-total : 20 % en France ; autoliquidation dans un autre pays de l'UE avec un numéro de TVA valide. Le montant final est calculé sur la page de paiement (Stripe)."]);
      L.push([en ? "Your key" : "Votre clé", n !== null && n > 1
        ? (en ? ("A single key for " + n + " computers, emailed once the payment is verified.") : ("Une seule clé pour " + n + " ordinateurs, envoyée par courriel après vérification du paiement."))
        : (en ? "Emailed to the address entered at payment, once the payment is verified." : "Envoyée par courriel à l'adresse saisie lors du paiement, après vérification du paiement.")]);
    }
    while (recap.firstChild) { recap.removeChild(recap.firstChild); }
    L.forEach(function (x) { recap.appendChild(ligne(x[0], x[1])); });
  }
  function majPostes() {
    var entreprise = f.profil.value === "entreprise";
    blocPostes.hidden = !entreprise;
    if (!entreprise && champPostes.value !== "1") { champPostes.value = "1"; }      // revenir à Standard ne garde pas la quantité Expert
    majRecap();
  }
  Array.prototype.forEach.call(f.querySelectorAll("input[name=profil]"), function (r) { r.addEventListener("change", majPostes); });
  if (champPostes) { champPostes.addEventListener("input", majRecap); }
  // Cartes « Choisir Standard / Expert » : cochent l'édition dans le formulaire ; le lien mène ensuite au formulaire.
  Array.prototype.forEach.call(document.querySelectorAll("a[data-choix]"), function (a) {
    a.addEventListener("click", function () {
      var r = f.querySelector('input[name=profil][value="' + a.getAttribute("data-choix") + '"]');
      if (!r) { return; }
      r.checked = true;
      majPostes();
      window.setTimeout(function () { r.focus(); }, 0);
    });
  });
  window.SN_MAJ_TARIF = function () { majTarifAffiche(); majPostes(); };          // relance l'affichage (vérifications avec SN_DATE_TEST)
  majTarifAffiche();
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
