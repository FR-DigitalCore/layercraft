import { site } from "@/lib/site";

/**
 * Schema.org ProfessionalService : l'activité est nationale et vendue en
 * ligne, pas rattachée à un point de vente local — d'où areaServed sur le
 * pays entier plutôt qu'un LocalBusiness de quartier.
 */
export function JsonLdService() {
  const donnees = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: site.nom,
    description: site.description,
    url: site.url,
    email: site.email,
    telephone: site.telephone,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.adresse.rue,
      postalCode: site.adresse.codePostal,
      addressLocality: site.adresse.ville,
      addressCountry: site.adresse.pays,
    },
    areaServed: { "@type": "Country", name: "France" },
    priceRange: "€€",
    knowsAbout: ["impression 3D", "modélisation 3D", "prototypage", "FDM"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees) }}
    />
  );
}
