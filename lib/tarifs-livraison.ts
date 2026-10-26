import "server-only";
import { cache } from "react";
import type { ModeLivraison } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GRILLE_PORT_DEFAUT, MODES_LIVRAISON, type GrillePort } from "@/lib/livraison";

/**
 * Grille de port courante. Table vide = tarifs par défaut : le site
 * fonctionne sans configuration, comme pour la grille d'impression.
 */
export const chargerGrillePort = cache(async (): Promise<GrillePort> => {
  try {
    const lignes = await prisma.tarifLivraison.findMany({
      orderBy: { poidsMaxG: "asc" },
    });
    if (lignes.length === 0) return GRILLE_PORT_DEFAUT;

    const grille = Object.fromEntries(
      MODES_LIVRAISON.map((mode) => [mode, [] as GrillePort[ModeLivraison]]),
    ) as GrillePort;

    for (const ligne of lignes) {
      if (grille[ligne.transporteur]) {
        grille[ligne.transporteur].push({
          poidsMaxG: ligne.poidsMaxG,
          prix: ligne.prix,
        });
      }
    }

    // Un transporteur sans palier enregistré garde ses valeurs par défaut,
    // plutôt que de devenir silencieusement indisponible.
    for (const mode of MODES_LIVRAISON) {
      if (grille[mode].length === 0) grille[mode] = GRILLE_PORT_DEFAUT[mode];
    }

    return grille;
  } catch (erreur) {
    console.error("[livraison] lecture impossible, grille par défaut", erreur);
    return GRILLE_PORT_DEFAUT;
  }
});

export async function enregistrerGrillePort(grille: GrillePort): Promise<void> {
  const lignes = MODES_LIVRAISON.flatMap((mode) =>
    grille[mode].map((palier) => ({
      transporteur: mode,
      poidsMaxG: palier.poidsMaxG,
      prix: palier.prix,
    })),
  );

  await prisma.$transaction([
    prisma.tarifLivraison.deleteMany({}),
    prisma.tarifLivraison.createMany({ data: lignes }),
  ]);
}
