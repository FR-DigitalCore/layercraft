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

export type GrilleTarifaire = {
  matieres: Record<Matiere, number>;
  qualites: Record<Qualite, number>;
  remises: Remise[];
};

/**
 * Grille utilisée tant que rien n'a été saisi dans /admin/tarifs,
 * et en repli si la base n'est pas joignable.
 */
export const GRILLE_DEFAUT: GrilleTarifaire = {
  matieres: { PLA: 8, PETG: 10, ASA: 12, TPU: 14 },
  qualites: { draft: 0.8, standard: 1, fine: 1.4 },
  remises: [
    { seuil: 3, coefficient: 0.92 },
    { seuil: 5, coefficient: 0.85 },
  ],
};

/** Coefficient du palier le plus avantageux atteint par la quantité. */
export function remiseApplicable(remises: Remise[], quantite: number): number {
  return remises
    .filter((r) => quantite >= r.seuil)
    .reduce((meilleur, r) => Math.min(meilleur, r.coefficient), 1);
}

export function estimerPrix(
  config: {
    matiere: Matiere;
    qualite: Qualite;
    quantite: number;
  },
  grille: GrilleTarifaire = GRILLE_DEFAUT,
): number {
  const base =
    (grille.matieres[config.matiere] ?? GRILLE_DEFAUT.matieres[config.matiere]) *
    (grille.qualites[config.qualite] ?? GRILLE_DEFAUT.qualites[config.qualite]);
  const remise = remiseApplicable(grille.remises, config.quantite);
  return Math.round(base * config.quantite * remise * 100) / 100;
}

export function formatPrix(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(valeur);
}
