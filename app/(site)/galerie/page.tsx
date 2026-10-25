import type { Metadata } from "next";
import { listerRealisations, tagsUniques } from "@/lib/realisations";
import { GalerieGrid } from "@/components/GalerieGrid";
import { TitreSection } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Réalisations",
  description:
    "Pièces techniques, prototypes et objets sur mesure imprimés en 3D : quelques exemples de ce qui sort de l'atelier.",
  alternates: { canonical: "/galerie" },
};

export const revalidate = 300;

export default async function GaleriePage() {
  const realisations = await listerRealisations();
  const tags = tagsUniques(realisations);

  return (
    <div className="conteneur py-16">
      <TitreSection
        surtitre="Galerie"
        titre="Réalisations"
        chapeau="Un aperçu des pièces produites à l'atelier. Un projet similaire ? Le devis est gratuit."
      />

      {realisations.length > 0 ? (
        <GalerieGrid realisations={realisations} tags={tags} />
      ) : (
        <div className="mt-10 rounded-xl border border-border bg-surface p-10 text-center">
          <p className="text-sm text-muted">
            La galerie se remplit — les premières réalisations seront publiées ici.
          </p>
          <ButtonLink href="/devis" className="mt-6">
            Demander un devis
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
