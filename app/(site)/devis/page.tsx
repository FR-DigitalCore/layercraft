import { Suspense } from "react";
import type { Metadata } from "next";
import { DevisForm } from "@/components/DevisForm";
import { TitreSection } from "@/components/ui/Card";
import { chargerGrille } from "@/lib/tarifs";
import { chargerConfigLivraison } from "@/lib/tarifs-livraison";
import { modesDisponibles } from "@/lib/livraison";

export const metadata: Metadata = {
  title: "Demander un devis",
  description:
    "Configurateur en ligne : déposez votre fichier STL ou décrivez votre pièce, choisissez la matière et la finition, recevez une estimation immédiate.",
  alternates: { canonical: "/devis" },
};

// Régénérée à l'enregistrement d'une nouvelle grille (revalidatePath dans /api/tarifs).
export const revalidate = 3600;

export default async function DevisPage() {
  const [grille, configLivraison] = await Promise.all([
    chargerGrille(),
    chargerConfigLivraison(),
  ]);

  return (
    <div className="conteneur py-16">
      <TitreSection
        surtitre="Devis"
        titre="Configurez votre impression"
        chapeau="Trois étapes, deux minutes. Estimation immédiate, devis ferme sous 24 à 48 h ouvrées."
      />
      <Suspense
        fallback={
          <div className="mt-10 h-96 animate-pulse rounded-xl border border-border bg-surface" />
        }
      >
        <DevisForm
          grille={grille}
          grillePort={configLivraison.grille}
          modesLivraison={modesDisponibles(configLivraison.actifs)}
        />
      </Suspense>
    </div>
  );
}
