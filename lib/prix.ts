export const MATIERES = ["PLA", "PETG", "ASA", "TPU"] as const;
export const QUALITES = ["draft", "standard", "fine"] as const;

export type Matiere = (typeof MATIERES)[number];
export type Qualite = (typeof QUALITES)[number];

export const MATIERE_INFOS: Record<
  Matiere,
  { titre: string; resume: string; usages: string }
> = {
  PLA: {
    titre: "PLA",
    resume: "Le polyvalent. Rendu net, large choix de couleurs, économique.",
    usages: "Prototypes, objets déco, pièces d'intérieur peu sollicitées.",
  },
  PETG: {
    titre: "PETG",
    resume: "Résistant et souple à la casse, supporte l'humidité.",
    usages: "Pièces fonctionnelles, supports, contact alimentaire ponctuel.",
  },
  ASA: {
    titre: "ASA",
    resume: "Tient les UV et la chaleur sans jaunir.",
    usages: "Pièces extérieures, automobile, boîtiers exposés au soleil.",
  },
  TPU: {
    titre: "TPU",
    resume: "Flexible façon caoutchouc, très bonne résistance à l'abrasion.",
    usages: "Joints, amortisseurs, coques souples, patins antidérapants.",
  },
};

export const QUALITE_INFOS: Record<
  Qualite,
  { titre: string; couche: string; resume: string; delai: string }
> = {
  draft: {
    titre: "Rapide",
    couche: "0,3 mm",
    resume: "Couches visibles, impression la plus rapide.",
    delai: "Délai indicatif : 1 à 2 jours",
  },
  standard: {
    titre: "Standard",
    couche: "0,2 mm",
    resume: "Le meilleur compromis finition / délai.",
    delai: "Délai indicatif : 2 à 3 jours",
  },
  fine: {
    titre: "Fine",
    couche: "0,1 mm",
    resume: "Finition soignée, détails marqués, impression plus longue.",
    delai: "Délai indicatif : 3 à 5 jours",
  },
};

/** Palier de remise : à partir de `seuil` pièces, on applique `coefficient`. */
export type Remise = { seuil: number; coefficient: number };

export const MODES = ["FORFAIT", "MATIERE", "MATIERE_TEMPS"] as const;
export type ModeTarification = (typeof MODES)[number];

export const MODE_INFOS: Record<
  ModeTarification,
  { titre: string; resume: string; formule: string; besoinVolume: boolean }
> = {
  FORFAIT: {
    titre: "Forfait par matière",
    resume:
      "Un prix fixe par pièce selon la matière, ajusté par la qualité. Simple à annoncer, indépendant de la taille de la pièce.",
    formule: "prix de base × coefficient qualité × quantité × remise",
    besoinVolume: false,
  },
  MATIERE: {
    titre: "Au poids de matière",
    resume:
      "La pièce est facturée à la matière réellement consommée, plus un forfait de mise en route. Nécessite le volume du STL.",
    formule:
      "(mise en route + masse × prix au gramme × coef. qualité) × quantité × remise",
    besoinVolume: true,
  },
  MATIERE_TEMPS: {
    titre: "Matière + temps machine",
    resume:
      "Matière consommée et temps d'impression estimé. Le modèle le plus proche des coûts réels, et le plus sensible à la finition demandée.",
    formule:
      "(mise en route + masse × prix au gramme + heures × prix horaire) × quantité × remise",
    besoinVolume: true,
  },
};

export function estModeValide(valeur: unknown): valeur is ModeTarification {
  return typeof valeur === "string" && MODES.includes(valeur as ModeTarification);
}

export type TarifMatiereConfig = {
  /** Mode FORFAIT : prix HT d'une pièce en qualité standard. */
  prixBase: number;
  /** Modes MATIERE et MATIERE_TEMPS : prix HT du gramme de filament. */
  prixParGramme: number;
  /** g/cm³, pour convertir un volume en masse. */
  densite: number;
};

export type TarifQualiteConfig = {
  /** Mode FORFAIT : multiplicateur du prix de base. */
  multiplicateur: number;
  /** Mode MATIERE_TEMPS : débit d'impression en cm³/h. */
  debitCm3ParHeure: number;
};

export type GrilleTarifaire = {
  mode: ModeTarification;
  matieres: Record<Matiere, TarifMatiereConfig>;
  qualites: Record<Qualite, TarifQualiteConfig>;
  remises: Remise[];
  /** Forfait fixe ajouté une fois par commande (modes MATIERE et MATIERE_TEMPS). */
  fraisMiseEnRoute: number;
  /** Prix HT de l'heure machine (mode MATIERE_TEMPS). */
  prixHoraire: number;
  /** Part de matière réellement déposée, 0,25 = 25 % de remplissage. */
  tauxRemplissage: number;
  /** Volume retenu quand le client n'a pas joint de fichier, en cm³. */
  volumeParDefaut: number;
};

/**
 * Grille utilisée tant que rien n'a été saisi dans /admin/tarifs,
 * et en repli si la base n'est pas joignable.
 * Valeurs indicatives : à recaler sur les coûts réels.
 */
export const GRILLE_DEFAUT: GrilleTarifaire = {
  mode: "FORFAIT",
  matieres: {
    PLA: { prixBase: 8, prixParGramme: 0.06, densite: 1.24 },
    PETG: { prixBase: 10, prixParGramme: 0.07, densite: 1.27 },
    ASA: { prixBase: 12, prixParGramme: 0.09, densite: 1.07 },
    TPU: { prixBase: 14, prixParGramme: 0.12, densite: 1.21 },
  },
  qualites: {
    draft: { multiplicateur: 0.8, debitCm3ParHeure: 12 },
    standard: { multiplicateur: 1, debitCm3ParHeure: 8 },
    fine: { multiplicateur: 1.4, debitCm3ParHeure: 4 },
  },
  remises: [
    { seuil: 3, coefficient: 0.92 },
    { seuil: 5, coefficient: 0.85 },
  ],
  fraisMiseEnRoute: 5,
  prixHoraire: 4,
  tauxRemplissage: 0.25,
  volumeParDefaut: 30,
};

/** Coefficient du palier le plus avantageux atteint par la quantité. */
export function remiseApplicable(remises: Remise[], quantite: number): number {
  return remises
    .filter((r) => quantite >= r.seuil)
    .reduce((meilleur, r) => Math.min(meilleur, r.coefficient), 1);
}

export type ConfigPrix = {
  matiere: Matiere;
  qualite: Qualite;
  quantite: number;
  /** Volume brut du STL en cm³. Absent = volume par défaut de la grille. */
  volumeCm3?: number | null;
};

export type DetailPrix = {
  total: number;
  /** Détail unitaire, avant quantité et remise. */
  parPiece: number;
  remise: number;
  /** Volume effectivement utilisé pour le calcul, en cm³. */
  volumeCm3: number;
  /** null en mode FORFAIT, qui n'utilise ni masse ni temps. */
  masseG: number | null;
  heures: number | null;
  /** true quand le volume vient du réglage par défaut faute de STL. */
  volumeEstime: boolean;
};

/**
 * Volume réellement déposé : le remplissage ne s'applique qu'au coeur de la
 * pièce, mais parois et couches pleines en consomment toujours une partie.
 * On borne donc à 35 % minimum du volume brut pour ne pas sous-facturer.
 */
function volumeDepose(volumeBrut: number, tauxRemplissage: number): number {
  return volumeBrut * Math.max(0.35, Math.min(1, tauxRemplissage));
}

/** Calcul détaillé, utilisé par le simulateur de l'admin. */
export function detaillerPrix(
  config: ConfigPrix,
  grille: GrilleTarifaire = GRILLE_DEFAUT,
): DetailPrix {
  const matiere = grille.matieres[config.matiere] ?? GRILLE_DEFAUT.matieres[config.matiere];
  const qualite = grille.qualites[config.qualite] ?? GRILLE_DEFAUT.qualites[config.qualite];
  const remise = remiseApplicable(grille.remises, config.quantite);

  const volumeFourni =
    typeof config.volumeCm3 === "number" && config.volumeCm3 > 0 ? config.volumeCm3 : null;
  const volumeCm3 = volumeFourni ?? grille.volumeParDefaut;

  const arrondir = (valeur: number) => Math.round(valeur * 100) / 100;

  if (grille.mode === "FORFAIT") {
    const parPiece = matiere.prixBase * qualite.multiplicateur;
    return {
      total: arrondir(parPiece * config.quantite * remise),
      parPiece: arrondir(parPiece),
      remise,
      volumeCm3,
      masseG: null,
      heures: null,
      volumeEstime: volumeFourni === null,
    };
  }

  const volumeUtile = volumeDepose(volumeCm3, grille.tauxRemplissage);
  const masseG = volumeUtile * matiere.densite;
  const coutMatiere = masseG * matiere.prixParGramme;

  if (grille.mode === "MATIERE") {
    const parPiece = grille.fraisMiseEnRoute + coutMatiere * qualite.multiplicateur;
    return {
      total: arrondir(parPiece * config.quantite * remise),
      parPiece: arrondir(parPiece),
      remise,
      volumeCm3,
      masseG: Math.round(masseG * 10) / 10,
      heures: null,
      volumeEstime: volumeFourni === null,
    };
  }

  const heures = volumeUtile / Math.max(0.1, qualite.debitCm3ParHeure);
  const parPiece = grille.fraisMiseEnRoute + coutMatiere + heures * grille.prixHoraire;
  return {
    total: arrondir(parPiece * config.quantite * remise),
    parPiece: arrondir(parPiece),
    remise,
    volumeCm3,
    masseG: Math.round(masseG * 10) / 10,
    heures: Math.round(heures * 100) / 100,
    volumeEstime: volumeFourni === null,
  };
}

export function estimerPrix(
  config: ConfigPrix,
  grille: GrilleTarifaire = GRILLE_DEFAUT,
): number {
  return detaillerPrix(config, grille).total;
}

export function formatPrix(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(valeur);
}
