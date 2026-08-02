import "server-only";
import type { Realisation } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BUCKET_GALERIE, urlSignee } from "@/lib/minio";

export type RealisationAffichee = Realisation & { imageUrl: string };

/** Image de repli quand MinIO n'est pas joignable (dev sans stack docker). */
const IMAGE_REPLI = "/galerie/placeholder.svg";

async function avecUrls(
  realisations: Realisation[],
): Promise<RealisationAffichee[]> {
  return Promise.all(
    realisations.map(async (r) => ({
      ...r,
      imageUrl: await urlSignee(BUCKET_GALERIE, r.imageKey, 3600).catch(() => IMAGE_REPLI),
    })),
  );
}

/**
 * Les pages publiques ne doivent pas tomber si la base n'est pas joignable
 * (build CI, première install) : on log et on renvoie une liste vide.
 */
export async function listerRealisations(limite?: number): Promise<RealisationAffichee[]> {
  try {
    const realisations = await prisma.realisation.findMany({
      where: { visible: true },
      orderBy: [{ ordre: "asc" }, { createdAt: "desc" }],
      take: limite,
    });
    return avecUrls(realisations);
  } catch (erreur) {
    console.error("[realisations] lecture impossible", erreur);
    return [];
  }
}

export async function listerToutesRealisations(): Promise<RealisationAffichee[]> {
  const realisations = await prisma.realisation.findMany({
    orderBy: [{ ordre: "asc" }, { createdAt: "desc" }],
  });
  return avecUrls(realisations);
}

export function tagsUniques(realisations: RealisationAffichee[]): string[] {
  return [...new Set(realisations.flatMap((r) => r.tags))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
}
