import { listerToutesRealisations } from "@/lib/realisations";
import { RealisationsManager } from "@/components/admin/RealisationsManager";

export default async function AdminRealisationsPage() {
  const realisations = await listerToutesRealisations();

  return (
    <div className="conteneur py-10">
      <h1 className="text-2xl font-bold">Réalisations</h1>
      <p className="mt-1 text-sm text-muted">
        Les réalisations visibles alimentent la galerie publique, triées par ordre croissant.
      </p>
      <RealisationsManager realisations={realisations} />
    </div>
  );
}
