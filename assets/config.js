// Configuration des points d'accès du site marchand. Aucun secret ici : ce fichier est public.
// Tant que ces adresses sont vides, l'achat et le formulaire de suggestion restent inactifs et l'affichent honnêtement.
window.SN_CONFIG = {
  // Ex. "https://activation.sinenomine.app" : serveur qui crée la session de paiement (POST /api/v1/commandes)
  boutiqueUrl: "",
  // Ex. "https://activation.sinenomine.app" : serveur qui reçoit les suggestions (POST /api/v1/suggestions)
  suggestionsUrl: ""
};
