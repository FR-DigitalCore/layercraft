import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  estModeValide,
  GRILLE_DEFAUT,
  MATIERES,
  QUALITES,
  type GrilleTarifaire,
  type Matiere,
  type Qualite,
  type TarifMatiereConfig,
  type TarifQualiteConfig,
} from "@/lib/prix";

const ID_PARAMETRES = "global";

/**
 * Grille tarifaire courante. Toute valeur absente de la base retombe sur
 * GRILLE_DEFAUT, ce qui permet de faire tourner le site sans rien avoir saisi.
 * `cache` évite de relire la base plusieurs fois dans un même rendu.
 */
export const chargerGrille = cache(async (): Promise<GrilleTarifaire> => {
  try {
    const [matieres, qualites, remises, parametres] = await Promise.all([
      prisma.tarifMatiere.findMany(),
      prisma.tarifQualite.findMany(),
      prisma.remiseQuantite.findMany({ orderBy: { seuil: "asc" } }),
      prisma.parametresTarification.findUnique({ where: { id: ID_PARAMETRES } }),
    ]);

    const parMatiere = new Map(matieres.map((t) => [t.matiere, t]));
    const parQualite = new Map(qualites.map((t) => [t.qualite, t]));

    return {
      mode:
        parametres && estModeValide(parametres.mode) ? parametres.mode : GRILLE_DEFAUT.mode,
      matieres: Object.fromEntries(
        MATIERES.map((m): [Matiere, TarifMatiereConfig] => {
          const enregistre = parMatiere.get(m);
          const defaut = GRILLE_DEFAUT.matieres[m];
          return [
            m,
            {
              prixBase: enregistre?.prixBase ?? defaut.prixBase,
              prixParGramme: enregistre?.prixParGramme ?? defaut.prixParGramme,
              densite: enregistre?.densite ?? defaut.densite,
            },
          ];
        }),
      ) as Record<Matiere, TarifMatiereConfig>,
      qualites: Object.fromEntries(
        QUALITES.map((q): [Qualite, TarifQualiteConfig] => {
          const enregistre = parQualite.get(q);
          const defaut = GRILLE_DEFAUT.qualites[q];
          return [
            q,
            {
              multiplicateur: enregistre?.multiplicateur ?? defaut.multiplicateur,
              debitCm3ParHeure:
                enregistre?.debitCm3ParHeure ?? defaut.debitCm3ParHeure,
            },
          ];
        }),
      ) as Record<Qualite, TarifQualiteConfig>,
      remises:
        remises.length > 0
          ? remises.map(({ seuil, coefficient }) => ({ seuil, coefficient }))
          : GRILLE_DEFAUT.remises,
      fraisMiseEnRoute: parametres?.fraisMiseEnRoute ?? GRILLE_DEFAUT.fraisMiseEnRoute,
      prixHoraire: parametres?.prixHoraire ?? GRILLE_DEFAUT.prixHoraire,
      tauxRemplissage: parametres?.tauxRemplissage ?? GRILLE_DEFAUT.tauxRemplissage,
      volumeParDefaut: parametres?.volumeParDefaut ?? GRILLE_DEFAUT.volumeParDefaut,
    };
  } catch (erreur) {
    console.error("[tarifs] lecture impossible, grille par défaut utilisée", erreur);
    return GRILLE_DEFAUT;
  }
});

/** Remplace intégralement la grille enregistrée. */
export async function enregistrerGrille(grille: GrilleTarifaire): Promise<void> {
  const parametres = {
    mode: grille.mode,
    fraisMiseEnRoute: grille.fraisMiseEnRoute,
    prixHoraire: grille.prixHoraire,
    tauxRemplissage: grille.tauxRemplissage,
    volumeParDefaut: grille.volumeParDefaut,
  };

  await prisma.$transaction([
    prisma.parametresTarification.upsert({
      where: { id: ID_PARAMETRES },
      create: { id: ID_PARAMETRES, ...parametres },
      update: parametres,
    }),
    ...MATIERES.map((matiere) =>
      prisma.tarifMatiere.upsert({
        where: { matiere },
        create: { matiere, ...grille.matieres[matiere] },
        update: grille.matieres[matiere],
      }),
    ),
    ...QUALITES.map((qualite) =>
      prisma.tarifQualite.upsert({
        where: { qualite },
        create: { qualite, ...grille.qualites[qualite] },
        update: grille.qualites[qualite],
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
