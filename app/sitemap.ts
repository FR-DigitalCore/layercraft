import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const maintenant = new Date();

  return [
    { url: site.url, lastModified: maintenant, changeFrequency: "monthly", priority: 1 },
    {
      url: `${site.url}/galerie`,
      lastModified: maintenant,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${site.url}/devis`,
      lastModified: maintenant,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${site.url}/mentions-legales`,
      lastModified: maintenant,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${site.url}/confidentialite`,
      lastModified: maintenant,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
