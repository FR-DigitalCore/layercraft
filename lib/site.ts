/**
 * Point unique de configuration éditoriale : nom commercial, coordonnées,
 * zone desservie. Repris dans le footer, les emails, le SEO et le JSON-LD.
 */
export const site = {
  nom: "LayerCraft",
  baseline: "Impression 3D sur mesure, partout en France",
  description:
    "Service d'impression 3D en ligne : devis immédiat, conseil technique, conception et impression de pièces sur mesure en PLA, PETG, ASA et TPU. Livraison partout en France.",
  email: "contact@layercraft.fr",
  telephone: "+33 6 00 00 00 00",
  adresse: {
    rue: "1 rue de l'Exemple",
    codePostal: "75000",
    ville: "Paris",
    pays: "FR",
  },
  zone: "France métropolitaine et Corse",
  siret: "000 000 000 00000",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
