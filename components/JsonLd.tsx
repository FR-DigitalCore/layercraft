import { site } from "@/lib/site";

/** Schema.org LocalBusiness — améliore l'affichage dans les résultats locaux. */
export function JsonLdLocalBusiness() {
  const donnees = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
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
    areaServed: {
      "@type": "AdministrativeArea",
      name: "Ain (01), France",
    },
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
