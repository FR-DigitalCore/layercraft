import { chargerGrillePort } from "@/lib/tarifs-livraison";
import { mondialRelayConfigure } from "@/lib/transporteurs/mondial-relay";
import { LivraisonForm } from "@/components/admin/LivraisonForm";
import { Card } from "@/components/ui/Card";

export default async function AdminLivraisonPage() {
  const grille = await chargerGrillePort();
  const relaisActif = mondialRelayConfigure();

  return (
    <div className="conteneur py-10">
      <h1 className="text-2xl font-bold">Livraison</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Tarifs de port appliqués au configurateur et repris dans le montant à régler.
        La masse du colis est déduite du volume de la pièce, de la densité de la
        matière et du taux de remplissage réglés dans les tarifs d&apos;impression.
      </p>

      {!relaisActif && (
        <Card className="mt-6 border-amber-500/30 bg-amber-500/5">
          <p className="text-sm leading-relaxed">
            <strong className="font-semibold">Recherche de points relais inactive.</strong>{" "}
            Renseignez <code className="text-accent">MONDIAL_RELAY_ENSEIGNE</code> et{" "}
            <code className="text-accent">MONDIAL_RELAY_CLE_PRIVEE</code> pour que le
            client choisisse son point dans une liste. Sans cela, l&apos;option reste
            proposée et le client saisit le numéro de son point relais, à confirmer au
            devis.
          </p>
        </Card>
      )}

      <LivraisonForm grilleInitiale={grille} />
    </div>
  );
}
