import { site } from "@/lib/site";
import { entreprise } from "@/lib/entreprise";
import { MATIERES, MATIERE_INFOS } from "@/lib/prix";

function balise(donnees: unknown) {
  return (
    <script
      type="application/ld+json"
      // Les données sont construites ici, jamais issues d'une saisie.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(donnees) }}
    />
  );
}

/**
 * Schema.org ProfessionalService : l'activité est nationale et vendue en
 * ligne, pas rattachée à un point de vente local — d'où areaServed sur le
 * pays entier plutôt qu'un LocalBusiness de quartier.
 *
 * Le catalogue de matières donne à Google de quoi comprendre ce qui est
 * vendu, sans inventer de prix : la tarification dépend du volume de la
 * pièce, annoncer un montant ici serait faux.
 */
export function JsonLdService() {
  return balise({
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${site.url}/#entreprise`,
    name: site.nom,
    legalName: entreprise.raisonSociale,
    description: site.description,
    url: site.url,
    logo: `${site.url}/logo.png`,
    image: `${site.url}/opengraph-image.png`,
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
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Impression 3D à la demande",
      itemListElement: MATIERES.map((matiere) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: `Impression 3D en ${MATIERE_INFOS[matiere].titre}`,
          description: MATIERE_INFOS[matiere].resume,
        },
      })),
    },
  });
}

/**
 * Fil d'Ariane. La page d'accueil est toujours le premier maillon, les
 * autres sont donnés dans l'ordre de la navigation.
 */
export function JsonLdFilAriane({
  elements,
}: {
  elements: Array<{ nom: string; chemin: string }>;
}) {
  return balise({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [{ nom: "Accueil", chemin: "/" }, ...elements].map(
      (element, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: element.nom,
        item: `${site.url}${element.chemin === "/" ? "" : element.chemin}`,
      }),
    ),
  });
}

/**
 * Questions fréquentes. Le balisage doit refléter mot pour mot ce que la
 * page affiche : Google sanctionne un FAQPage dont les réponses ne sont pas
 * visibles par le visiteur.
 */
export function JsonLdFaq({
  questions,
}: {
  questions: ReadonlyArray<{ question: string; reponse: string }>;
}) {
  return balise({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ question, reponse }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: reponse },
    })),
  });
}
