import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { prisma } from "@/lib/prisma";

// Régénéré une fois par heure. Interroger la base à chaque requête serait
// inutile, et la figer au build ferait mentir la date de la galerie.
export const revalidate = 3600;

/**
 * Date de la dernière réalisation publiée. Un `new Date()` pour toutes les
 * pages annoncerait à chaque déploiement que l'ensemble du site a changé :
 * les moteurs finissent par ignorer une date qui bouge sans raison.
 */
async function derniereRealisation(): Promise<Date | undefined> {
  try {
    // Le modèle Realisation n'a pas de updatedAt : la date de publication
    // suffit à dater la galerie.
    const recente = await prisma.realisation.findFirst({
      where: { visible: true },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    return recente?.createdAt;
  } catch (erreur) {
    // Base injoignable au moment de la régénération : mieux vaut un sitemap
    // sans date qu'un sitemap absent.
    console.error("[sitemap] date de la galerie indisponible", erreur);
    return undefined;
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const galerieMaj = await derniereRealisation();

  return [
    { url: site.url, lastModified: galerieMaj, changeFrequency: "monthly", priority: 1 },
    {
      url: `${site.url}/devis`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${site.url}/galerie`,
      lastModified: galerieMaj,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${site.url}/cgv`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${site.url}/mentions-legales`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${site.url}/confidentialite`,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
