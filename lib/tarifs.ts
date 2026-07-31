import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  GRILLE_DEFAUT,
  MATIERES,
  QUALITES,
  type GrilleTarifaire,
  type Matiere,
  type Qualite,
} from "@/lib/prix";

/**
 * Grille tarifaire courante. Toute valeur absente de la base retombe sur
 * GRILLE_DEFAUT, ce qui permet de faire tourner le site sans rien avoir saisi.
 * `cache` évite de relire la base plusieurs fois dans un même rendu.
 */
export const chargerGrille = cache(async (): Promise<GrilleTarifaire> => {
  try {
    const [matieres, qualites, remises] = await Promise.all([
      prisma.tarifMatiere.findMany(),
      prisma.tarifQualite.findMany(),
      prisma.remiseQuantite.findMany({ orderBy: { seuil: "asc" } }),
    ]);

    const parMatiere = new Map(matieres.map((t) => [t.matiere, t.prixBase]));
    const parQualite = new Map(qualites.map((t) => [t.qualite, t.multiplicateur]));

    return {
      matieres: Object.fromEntries(
        MATIERES.map((m) => [m, parMatiere.get(m) ?? GRILLE_DEFAUT.matieres[m]]),
      ) as Record<Matiere, number>,
      qualites: Object.fromEntries(
        QUALITES.map((q) => [q, parQualite.get(q) ?? GRILLE_DEFAUT.qualites[q]]),
      ) as Record<Qualite, number>,
      remises:
        remises.length > 0
          ? remises.map(({ seuil, coefficient }) => ({ seuil, coefficient }))
          : GRILLE_DEFAUT.remises,
    };
  } catch (erreur) {
    console.error("[tarifs] lecture impossible, grille par défaut utilisée", erreur);
    return GRILLE_DEFAUT;
  }
});

/** Remplace intégralement la grille enregistrée. */
export async function enregistrerGrille(grille: GrilleTarifaire): Promise<void> {
  await prisma.$transaction([
    ...MATIERES.map((matiere) =>
      prisma.tarifMatiere.upsert({
        where: { matiere },
        create: { matiere, prixBase: grille.matieres[matiere] },
        update: { prixBase: grille.matieres[matiere] },
      }),
    ),
    ...QUALITES.map((qualite) =>
      prisma.tarifQualite.upsert({
        where: { qualite },
        create: { qualite, multiplicateur: grille.qualites[qualite] },
        update: { multiplicateur: grille.qualites[qualite] },
      }),
    ),
    prisma.remiseQuantite.deleteMany({
      where: { seuil: { notIn: grille.remises.map((r) => r.seuil) } },
    }),
    ...grille.remises.map((remise) =>
      prisma.remiseQuantite.upsert({
        where: { seuil: remise.seuil },
        create: remise,
        update: { coefficient: remise.coefficient },
      }),
    ),
  ]);
}
