import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { formatPrix, MATIERE_INFOS, QUALITE_INFOS, type Matiere, type Qualite } from "@/lib/prix";
import { formatDate, STATUT_INFOS } from "@/lib/statuts";
import { CommandeStatus } from "@/components/CommandeStatus";
import { BoutonPaiement } from "@/components/BoutonPaiement";
import { LIVRAISON_INFOS } from "@/lib/livraison";
import { Badge, Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Suivi de commande",
  robots: { index: false, follow: false },
};

export default async function SuiviPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ paiement?: string }>;
}) {
  const { token } = await params;
  const { paiement } = await searchParams;

  const devis = await prisma.devis
    .findUnique({
      where: { token },
      include: { evenements: { orderBy: { createdAt: "asc" } } },
    })
    .catch(() => null);

  if (!devis) notFound();

  const total = (devis.prixFinal ?? 0) + (devis.fraisPort ?? 0);
  const aRegler = devis.statut === "ACCEPTE" && devis.prixFinal !== null && !devis.payeLe;
  const paiementAnnule = paiement === "annule" && !devis.payeLe;

  const infos = STATUT_INFOS[devis.statut];
  const matiere = MATIERE_INFOS[devis.matiere as Matiere];
  const qualite = QUALITE_INFOS[devis.qualite as Qualite];

  return (
    <div className="conteneur max-w-4xl py-16">
      <p className="text-sm text-muted">Demande du {formatDate(devis.createdAt)}</p>
      <div className="mt-2 flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-bold sm:text-4xl">Bonjour {devis.nom}</h1>
        <Badge className={infos.couleur}>{infos.label}</Badge>
      </div>
      <p className="mt-4 max-w-xl leading-relaxed text-muted">{infos.description}</p>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-start">
        <Card>
          <h2 className="mb-6 text-lg font-semibold">Avancement</h2>
          <CommandeStatus statut={devis.statut} evenements={devis.evenements} />
        </Card>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">Votre demande</h2>
            <dl className="space-y-2.5 text-sm">
              <Ligne label="Matière" valeur={matiere ? matiere.titre : devis.matiere} />
              <Ligne
                label="Qualité"
                valeur={qualite ? `${qualite.titre} (${qualite.couche})` : devis.qualite}
              />
              {devis.couleur && <Ligne label="Couleur" valeur={devis.couleur} />}
              <Ligne label="Quantité" valeur={String(devis.quantite)} />
              {devis.stlNom && <Ligne label="Fichier" valeur={devis.stlNom} />}
            </dl>
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Prix</h2>
            <dl className="space-y-2.5 text-sm">
              <Ligne label="Estimation" valeur={formatPrix(devis.prixEstime)} />
              <Ligne
                label="Devis ferme"
                valeur={formatPrix(devis.prixFinal)}
                accent={devis.prixFinal !== null}
              />
              <Ligne
                label={LIVRAISON_INFOS[devis.modeLivraison].titre}
                valeur={
                  devis.fraisPort === null
                    ? "Sur devis"
                    : devis.fraisPort === 0
                      ? "Gratuit"
                      : formatPrix(devis.fraisPort)
                }
              />
              {aRegler && (
                <Ligne label="Total à régler" valeur={formatPrix(total)} accent />
              )}
            </dl>
            {devis.prixFinal === null && (
              <p className="mt-3 text-xs leading-relaxed text-muted">
                Le devis ferme apparaîtra ici dès que votre pièce aura été étudiée.
              </p>
            )}
            {devis.payeLe && (
              <p className="mt-3 text-xs leading-relaxed text-emerald-400">
                Réglé le {formatDate(devis.payeLe)}.
              </p>
            )}
          </Card>
        </div>
      </div>

      {aRegler && (
        <Card className="mt-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Votre devis est prêt</h2>
            <p className="mt-1 text-sm text-muted">
              Le règlement lance la production. Impression {formatPrix(devis.prixFinal)}
              {devis.fraisPort ? ` + ${formatPrix(devis.fraisPort)} de livraison` : ""}.
            </p>
          </div>
          <BoutonPaiement token={devis.token} montant={total} />
        </Card>
      )}

      {paiementAnnule && (
        <Card className="mt-8 border-amber-500/30 bg-amber-500/5">
          <p className="text-sm">
            Paiement interrompu. Rien n&apos;a été débité, vous pouvez reprendre quand
            vous voulez.
          </p>
        </Card>
      )}

      {devis.noteAdmin && (
        <Card className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Message de l&apos;atelier</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{devis.noteAdmin}</p>
        </Card>
      )}

      <Card className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          Une question sur cette commande ? Écrivez-nous en rappelant votre nom.
        </p>
        <ButtonLink href={`mailto:${site.email}`} variante="secondaire" taille="sm">
          {site.email}
        </ButtonLink>
      </Card>
    </div>
  );
}

function Ligne({
  label,
  valeur,
  accent,
}: {
  label: string;
  valeur: string;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={accent ? "font-bold text-accent" : "font-medium"}>{valeur}</dd>
    </div>
  );
}
