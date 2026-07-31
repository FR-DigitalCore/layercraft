import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Les pages de suivi sont publiques mais nominatives : hors index.
      disallow: ["/admin", "/api", "/suivi"],
    },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
