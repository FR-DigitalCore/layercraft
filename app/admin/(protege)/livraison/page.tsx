import { chargerConfigLivraison } from "@/lib/tarifs-livraison";
import { mondialRelayConfigure } from "@/lib/transporteurs/mondial-relay";
import { LivraisonForm } from "@/components/admin/LivraisonForm";

export default async function AdminLivraisonPage() {
  const { grille, actifs } = await chargerConfigLivraison();
  const relaisConfigure = mondialRelayConfigure();

  return (
    <div className="conteneur py-10">
      <h1 className="text-2xl font-bold">Livraison</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Choisissez les transporteurs proposés au client et leurs tarifs de port.
        Un transporteur masqué disparaît du configurateur et est refusé côté
        serveur. La masse du colis est déduite du volume de la pièce, de la
        densité de la matière et du taux de remplissage réglés dans les tarifs
        d&apos;impression.
      </p>

      <LivraisonForm
        grilleInitiale={grille}
        actifsInitiaux={actifs}
        mondialRelayConfigure={relaisConfigure}
      />
    </div>
  );
}
