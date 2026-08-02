import type { Statut } from "@prisma/client";

export const STATUTS: Statut[] = [
  "RECU",
  "EN_ETUDE",
  "ACCEPTE",
  "EN_IMPRESSION",
  "TERMINE",
  "EXPEDIE",
  "ANNULE",
];

/** Étapes affichées dans la timeline publique — ANNULE en est exclu. */
export const ETAPES_TIMELINE: Statut[] = [
  "RECU",
  "EN_ETUDE",
  "ACCEPTE",
  "EN_IMPRESSION",
  "TERMINE",
  "EXPEDIE",
];

export const STATUT_INFOS: Record<
  Statut,
  { label: string; description: string; couleur: string }
> = {
  RECU: {
    label: "Demande reçue",
    description: "Votre demande nous est bien parvenue.",
    couleur: "bg-sky-500/15 text-sky-300 border-sky-500/30",
  },
  EN_ETUDE: {
    label: "À l'étude",
    description: "Nous analysons la pièce et préparons le chiffrage.",
    couleur: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
  ACCEPTE: {
    label: "Devis accepté",
    description: "Le devis est validé, la pièce entre en file d'impression.",
    couleur: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  },
  EN_IMPRESSION: {
    label: "En impression",
    description: "L'imprimante tourne.",
    couleur: "bg-accent/15 text-accent border-accent/30",
  },
  TERMINE: {
    label: "Terminé",
    description: "L'impression est finie et contrôlée.",
    couleur: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  EXPEDIE: {
    label: "Expédié / remis",
    description: "La pièce est en route ou disponible en retrait.",
    couleur: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  ANNULE: {
    label: "Annulé",
    description: "La demande a été annulée.",
    couleur: "bg-red-500/15 text-red-300 border-red-500/30",
  },
};

export function estStatutValide(valeur: unknown): valeur is Statut {
  return typeof valeur === "string" && STATUTS.includes(valeur as Statut);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatDateCourte(date: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(
    new Date(date),
  );
}
