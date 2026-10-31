/**
 * Point unique de configuration éditoriale : nom commercial, coordonnées,
 * zone desservie. Repris dans le footer, les emails, le SEO et le JSON-LD.
 */
export const site = {
  nom: "LayerCraft",
  baseline: "Impression 3D sur mesure, partout en France",
  description:
    "Service d'impression 3D en ligne : devis immédiat, conseil technique, conception et impression de pièces sur mesure en PLA, PETG, ASA et TPU. Livraison partout en France.",
  email: "devis@layercraft.fr",
  telephone: "+33 7 82 49 87 35",
  adresse: {
    rue: "235 chemin de Bezaton",
    codePostal: "01310",
    ville: "Polliat",
    pays: "FR",
  },
  zone: "France métropolitaine et Corse",
  siret: "932 438 815 00023",
  // Sans la barre finale : l'URL est concaténée à des chemins commençant
  // eux-mêmes par « / », et un `https://exemple.fr/` donnerait des liens à
  // double barre dans les emails et le sitemap.
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, ""),
} as const;
