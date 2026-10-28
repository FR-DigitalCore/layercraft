import type { ModeLivraison } from "@prisma/client";
import { MATIERE_INFOS, type Matiere, type GrilleTarifaire } from "@/lib/prix";

export const MODES_LIVRAISON: ModeLivraison[] = [
  "RETRAIT",
  "COLISSIMO",
  "MONDIAL_RELAY",
];

export const LIVRAISON_INFOS: Record<
  ModeLivraison,
  { titre: string; resume: string; delai: string; adresse: boolean; pointRelais: boolean }
> = {
  RETRAIT: {
    titre: "Retrait sur place",
    resume: "Vous venez chercher la pièce à l'atelier, sur rendez-vous.",
    delai: "Dès que la pièce est prête",
    adresse: false,
    pointRelais: false,
  },
  COLISSIMO: {
    titre: "Colissimo à domicile",
    resume: "Remise contre signature à l'adresse de votre choix, avec suivi.",
    delai: "2 à 3 jours ouvrés après expédition",
    adresse: true,
    pointRelais: false,
  },
  MONDIAL_RELAY: {
    titre: "Mondial Relay",
    resume: "Retrait dans le point relais de votre choix. L'option la plus économique.",
    delai: "3 à 5 jours ouvrés après expédition",
    adresse: true,
    pointRelais: true,
  },
};

/** Palier de port : s'applique jusqu'à `poidsMaxG` grammes inclus. */
export type PalierPort = { poidsMaxG: number; prix: number };
export type GrillePort = Record<ModeLivraison, PalierPort[]>;

/**
 * Tarifs de départ, inspirés des grilles publiques des transporteurs.
 * Indicatifs : à recaler sur votre contrat depuis /admin/livraison.
 */
export const GRILLE_PORT_DEFAUT: GrillePort = {
  RETRAIT: [{ poidsMaxG: 30_000, prix: 0 }],
  COLISSIMO: [
    { poidsMaxG: 250, prix: 5.95 },
    { poidsMaxG: 500, prix: 7.45 },
    { poidsMaxG: 1_000, prix: 9.3 },
    { poidsMaxG: 2_000, prix: 10.4 },
    { poidsMaxG: 5_000, prix: 15.7 },
    { poidsMaxG: 10_000, prix: 21.5 },
    { poidsMaxG: 30_000, prix: 33 },
  ],
  MONDIAL_RELAY: [
    { poidsMaxG: 500, prix: 4.4 },
    { poidsMaxG: 1_000, prix: 5.2 },
    { poidsMaxG: 2_000, prix: 6 },
    { poidsMaxG: 5_000, prix: 8.2 },
    { poidsMaxG: 10_000, prix: 11.9 },
    { poidsMaxG: 20_000, prix: 17.4 },
    { poidsMaxG: 30_000, prix: 23 },
  ],
};

/** Emballage : calage et carton, au-delà de la pièce elle-même. */
const MASSE_EMBALLAGE_G = 80;
const MARGE_EMBALLAGE = 1.1;

/**
 * Masse expédiée, en grammes. Part du volume mesuré sur le STL et de la
 * densité de la matière, puis ajoute l'emballage. Sans volume connu, on
 * retombe sur le volume par défaut de la grille tarifaire.
 */
export function estimerMasseG(
  config: { matiere: Matiere; quantite: number; volumeCm3?: number | null },
  grille: GrilleTarifaire,
): number {
  const volume =
    typeof config.volumeCm3 === "number" && config.volumeCm3 > 0
      ? config.volumeCm3
      : grille.volumeParDefaut;

  const densite = grille.matieres[config.matiere]?.densite ?? 1.24;
  const remplissage = Math.max(0.35, Math.min(1, grille.tauxRemplissage));
  const massePieces = volume * remplissage * densite * config.quantite;

  return Math.round(massePieces * MARGE_EMBALLAGE + MASSE_EMBALLAGE_G);
}

/**
 * Prix du port pour une masse donnée : le plus petit palier qui la couvre.
 * Au-delà du dernier palier, le transport sort de la grille et doit être
 * chiffré à la main — on renvoie null plutôt qu'un prix faux.
 */
export function calculerFraisPort(
  mode: ModeLivraison,
  masseG: number,
  grille: GrillePort = GRILLE_PORT_DEFAUT,
): number | null {
  const paliers = [...(grille[mode] ?? [])].sort((a, b) => a.poidsMaxG - b.poidsMaxG);
  if (paliers.length === 0) return null;
  const palier = paliers.find((p) => masseG <= p.poidsMaxG);
  return palier ? palier.prix : null;
}

export function formatMasse(grammes: number): string {
  return grammes < 1000
    ? `${Math.round(grammes)} g`
    : `${(grammes / 1000).toFixed(2).replace(".", ",")} kg`;
}

export function estModeLivraisonValide(valeur: unknown): valeur is ModeLivraison {
  return (
    typeof valeur === "string" && MODES_LIVRAISON.includes(valeur as ModeLivraison)
  );
}

/** Densité affichée dans l'admin pour expliquer le calcul de masse. */
export function densiteMatiere(matiere: Matiere, grille: GrilleTarifaire): number {
  return grille.matieres[matiere]?.densite ?? 1.24;
}

export const MATIERES_INFOS_LIVRAISON = MATIERE_INFOS;
