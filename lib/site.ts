/**
 * Point unique de configuration éditoriale : nom commercial, coordonnées,
 * zone d'intervention. Repris dans le footer, les emails, le SEO et le JSON-LD.
 */
export const site = {
  nom: "LayerCraft",
  baseline: "Impression 3D sur mesure dans l'Ain",
  description:
    "Service d'impression 3D local à Bourg-en-Bresse : devis en ligne, conseil technique, conception et impression de pièces sur mesure en PLA, PETG, ASA et TPU.",
  email: "contact@layercraft.fr",
  telephone: "+33 6 00 00 00 00",
  adresse: {
    rue: "1 rue de l'Exemple",
    codePostal: "01000",
    ville: "Bourg-en-Bresse",
    pays: "FR",
  },
  zone: "Bourg-en-Bresse et tout le département de l'Ain (01)",
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=Bourg-en-Bresse",
  siret: "000 000 000 00000",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const;
