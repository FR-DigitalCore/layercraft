/**
 * Informations légales de l'éditeur.
 *
 * Tout ce qui est entre crochets est un espace réservé : remplacez la valeur
 * par la vôtre. Tant qu'il en reste, un bandeau d'avertissement s'affiche en
 * haut des pages légales — il disparaît de lui-même une fois tout rempli.
 *
 * Ces mentions sont obligatoires pour un site marchand français
 * (art. 6 III LCEN, art. L.221-5 du code de la consommation).
 */
export const entreprise = {
  /** Dénomination sociale exacte, telle qu'au Kbis. */
  raisonSociale: "[À COMPLÉTER — raison sociale]",
  /** SASU, SARL, EURL, entreprise individuelle… */
  formeJuridique: "[À COMPLÉTER — forme juridique]",
  /** Montant du capital social, ou chaîne vide pour une entreprise individuelle. */
  capitalSocial: "[À COMPLÉTER — capital social]",

  siret: "[À COMPLÉTER — SIRET à 14 chiffres]",
  rcs: "[À COMPLÉTER — ville du RCS et numéro]",
  /** Numéro de TVA intracommunautaire, ou chaîne vide si non assujetti. */
  tvaIntracom: "[À COMPLÉTER — TVA intracommunautaire]",
  /** Laisser vide si vous n'êtes pas assujetti à la TVA (franchise en base). */
  assujettiTva: true,

  adresse: {
    rue: "[À COMPLÉTER — adresse du siège]",
    codePostal: "[À COMPLÉTER]",
    ville: "[À COMPLÉTER]",
    pays: "France",
  },

  /** Personne responsable du contenu publié. */
  directeurPublication: "[À COMPLÉTER — nom du directeur de la publication]",

  hebergeur: {
    nom: "[À COMPLÉTER — nom de l'hébergeur]",
    adresse: "[À COMPLÉTER — adresse de l'hébergeur]",
    telephone: "[À COMPLÉTER — téléphone de l'hébergeur]",
  },

  /** Assurance responsabilité civile professionnelle, facultatif. */
  assurance: "",

  /** Médiateur de la consommation : obligatoire pour la vente aux particuliers. */
  mediateur: {
    nom: "[À COMPLÉTER — nom du médiateur de la consommation]",
    site: "[À COMPLÉTER — site du médiateur]",
  },

  /** Délai de fabrication annoncé, en jours ouvrés. */
  delaiFabricationJours: 5,
} as const;

type Noeud = string | number | boolean | { [cle: string]: Noeud };

function parcourir(valeur: Noeud, chemin: string[], trouves: string[]): void {
  if (typeof valeur === "string") {
    if (valeur.includes("[À COMPLÉTER")) trouves.push(chemin.join(" → "));
    return;
  }
  if (typeof valeur === "object") {
    for (const [cle, sousValeur] of Object.entries(valeur)) {
      parcourir(sousValeur, [...chemin, cle], trouves);
    }
  }
}

/**
 * Champs encore non renseignés. Les pages légales s'en servent pour afficher
 * un avertissement tant que la configuration est incomplète.
 */
export function placeholdersRestants(): string[] {
  const trouves: string[] = [];
  parcourir(entreprise as unknown as Noeud, [], trouves);
  return trouves;
}

/** Adresse du siège sur une ligne. */
export function adresseSiege(): string {
  const { rue, codePostal, ville, pays } = entreprise.adresse;
  return `${rue}, ${codePostal} ${ville}, ${pays}`;
}
