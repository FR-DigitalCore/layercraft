import "server-only";
import { cache } from "react";
import type { ModeLivraison } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  GRILLE_PORT_DEFAUT,
  MODES_LIVRAISON,
  TRANSPORTEURS_ACTIFS_DEFAUT,
  type GrillePort,
  type TransporteursActifs,
} from "@/lib/livraison";

export type ConfigLivraison = {
  grille: GrillePort;
  actifs: TransporteursActifs;
};

/**
 * Configuration de livraison courante : grille de port et transporteurs
 * activés. Tables vides = valeurs par défaut, le site fonctionne sans
 * configuration préalable.
 */
export const chargerConfigLivraison = cache(async (): Promise<ConfigLivraison> => {
  try {
    const [lignes, configs] = await Promise.all([
      prisma.tarifLivraison.findMany({ orderBy: { poidsMaxG: "asc" } }),
      prisma.transporteurConfig.findMany(),
    ]);

    const grille =
      lignes.length === 0
        ? GRILLE_PORT_DEFAUT
        : (() => {
            const construite = Object.fromEntries(
              MODES_LIVRAISON.map((mode) => [mode, [] as GrillePort[ModeLivraison]]),
            ) as GrillePort;

            for (const ligne of lignes) {
              construite[ligne.transporteur].push({
                poidsMaxG: ligne.poidsMaxG,
                prix: ligne.prix,
              });
            }
            // Un transporteur sans palier garde ses valeurs par défaut,
            // plutôt que de devenir silencieusement indisponible.
            for (const mode of MODES_LIVRAISON) {
              if (construite[mode].length === 0) construite[mode] = GRILLE_PORT_DEFAUT[mode];
            }
            return construite;
          })();

    const parMode = new Map(configs.map((c) => [c.transporteur, c.actif]));
    const actifs = Object.fromEntries(
      MODES_LIVRAISON.map((mode) => [
        mode,
        parMode.get(mode) ?? TRANSPORTEURS_ACTIFS_DEFAUT[mode],
      ]),
    ) as TransporteursActifs;

    return { grille, actifs };
  } catch (erreur) {
    console.error("[livraison] lecture impossible, valeurs par défaut", erreur);
    return { grille: GRILLE_PORT_DEFAUT, actifs: TRANSPORTEURS_ACTIFS_DEFAUT };
  }
});

/** Conservé pour les appelants qui n'ont besoin que des tarifs. */
export async function chargerGrillePort(): Promise<GrillePort> {
  return (await chargerConfigLivraison()).grille;
}

export async function enregistrerConfigLivraison(
  config: ConfigLivraison,
): Promise<void> {
  const lignes = MODES_LIVRAISON.flatMap((mode) =>
    config.grille[mode].map((palier) => ({
      transporteur: mode,
      poidsMaxG: palier.poidsMaxG,
      prix: palier.prix,
    })),
  );

  await prisma.$transaction([
    prisma.tarifLivraison.deleteMany({}),
    prisma.tarifLivraison.createMany({ data: lignes }),
    ...MODES_LIVRAISON.map((mode) =>
      prisma.transporteurConfig.upsert({
        where: { transporteur: mode },
        create: { transporteur: mode, actif: config.actifs[mode] },
        update: { actif: config.actifs[mode] },
      }),
    ),
  ]);
}
