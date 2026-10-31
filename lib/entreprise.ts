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
  /**
   * Dénomination légale. Pour une entreprise individuelle, c'est l'état civil
   * de l'exploitant : la mention « EI » doit l'accompagner (art. R.123-237 du
   * code de commerce, obligatoire depuis mai 2022).
   */
  raisonSociale: "Alexis Boizard",
  /** Nom commercial, s'il diffère de la dénomination légale. */
  nomCommercial: "DigitalCore",
  formeJuridique: "entrepreneur individuel (EI)",
  /** Vide : une entreprise individuelle n'a pas de capital social. */
  capitalSocial: "",

  siret: "932 438 815 00023",
  /**
   * Registre d'immatriculation. Depuis le 1ᵉʳ janvier 2023, toute entreprise
   * française est inscrite au Registre national des entreprises.
   */
  immatriculation: "SIREN 932 438 815 — Registre national des entreprises (RNE)",
  /** Numéro de TVA intracommunautaire, ou chaîne vide si non assujetti. */
  tvaIntracom: "",
  /** Franchise en base : prix nets de taxe, mention art. 293 B du CGI. */
  assujettiTva: false,

  adresse: {
    rue: "235 chemin de Bezaton",
    codePostal: "01310",
    ville: "Polliat",
    pays: "France",
  },

  /** Personne responsable du contenu publié. */
  directeurPublication: "Alexis Boizard",

  hebergeur: {
    nom: "Infomaniak Network SA",
    adresse: "Rue Eugène-Marziano 25, 1227 Les Acacias, Genève, Suisse",
    telephone: "+41 22 820 35 44",
  },

  /** Assurance responsabilité civile professionnelle, facultatif. */
  assurance: "",

  /**
   * Médiateur de la consommation. L'adhésion est obligatoire dès la première
   * vente à un particulier (art. L.612-1 du code de la consommation) ; tant
   * que le nom est vide, les CGV le signalent et le bandeau reste affiché.
   */
  mediateur: {
    nom: "[À COMPLÉTER — nom du médiateur de la consommation]",
    site: "[À COMPLÉTER — site du médiateur]",
  },

  /** Délai de fabrication annoncé, en jours ouvrés. */
  delaiFabricationJours: 10,
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

/** Vrai une fois le médiateur de la consommation renseigné. */
export function mediateurRenseigne(): boolean {
  return !entreprise.mediateur.nom.includes("[À COMPLÉTER");
}

/** Adresse du siège sur une ligne. */
export function adresseSiege(): string {
  const { rue, codePostal, ville, pays } = entreprise.adresse;
  return `${rue}, ${codePostal} ${ville}, ${pays}`;
}
