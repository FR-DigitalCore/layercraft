import { chargerGrille } from "@/lib/tarifs";
import { TarifsForm } from "@/components/admin/TarifsForm";

export default async function AdminTarifsPage() {
  const grille = await chargerGrille();

  return (
    <div className="conteneur py-10">
      <h1 className="text-2xl font-bold">Tarifs</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Ces valeurs alimentent l&apos;estimation affichée dans le configurateur et le
        prix estimé enregistré avec chaque demande. Elles n&apos;affectent pas les devis
        déjà envoyés.
      </p>
      <TarifsForm grilleInitiale={grille} />
    </div>
  );
}
