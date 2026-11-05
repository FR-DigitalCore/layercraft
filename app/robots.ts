import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Pages nominatives ou sans intérêt pour l'index. Les pages
      // concernées portent aussi un meta robots noindex : un Disallow
      // seul n'empêche pas l'indexation d'une URL découverte par un
      // lien, il empêche seulement de la lire.
      disallow: ["/admin", "/api", "/suivi", "/mon-compte", "/connexion"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
