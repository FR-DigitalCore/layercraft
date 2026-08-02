import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BUCKET_STL, urlSignee } from "@/lib/minio";
import { formatPrix, MATIERE_INFOS, QUALITE_INFOS, type Matiere, type Qualite } from "@/lib/prix";
import { formatDate, STATUT_INFOS } from "@/lib/statuts";
import { urlSuivi } from "@/lib/emails";
import { Badge, Card } from "@/components/ui/Card";
import { CommandeActions } from "@/components/admin/CommandeActions";
import { CommandeStatus } from "@/components/CommandeStatus";

export default async function AdminCommandePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const devis = await prisma.devis.findUnique({
    where: { id },
    include: { evenements: { orderBy: { createdAt: "asc" } } },
  });

  if (!devis) notFound();

  const lienStl = devis.stlKey
    ? await urlSignee(BUCKET_STL, devis.stlKey, 3600).catch(() => null)
    : null;

  const matiere = MATIERE_INFOS[devis.matiere as Matiere];
  const qualite = QUALITE_INFOS[devis.qualite as Qualite];

  return (
    <div className="conteneur py-10">
      <Link href="/admin" className="text-sm text-muted hover:text-text">
        ← Toutes les commandes
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">{devis.nom}</h1>
        <Badge className={STATUT_INFOS[devis.statut].couleur}>
          {STATUT_INFOS[devis.statut].label}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-muted">Reçue le {formatDate(devis.createdAt)}</p>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-6">
          <Card>
            <h2 className="mb-4 text-lg font-semibold">Contact</h2>
            <dl className="space-y-2.5 text-sm">
              <Ligne label="Nom" valeur={devis.nom} />
              <Ligne
                label="Email"
                valeur={
                  <a href={`mailto:${devis.email}`} className="text-accent hover:underline">
                    {devis.email}
                  </a>
                }
              />
              {devis.telephone && (
                <Ligne
                  label="Téléphone"
                  valeur={
                    <a
                      href={`tel:${devis.telephone.replace(/\s/g, "")}`}
                      className="text-accent hover:underline"
                    >
                      {devis.telephone}
                    </a>
                  }
                />
              )}
            </dl>
            {devis.message && (
              <p className="mt-4 rounded-lg border border-border bg-surface-haut p-4 text-sm leading-relaxed whitespace-pre-wrap">
                {devis.message}
              </p>
            )}
          </Card>

          <Card>
            <h2 className="mb-4 text-lg font-semibold">Configuration</h2>
            <dl className="space-y-2.5 text-sm">
              <Ligne label="Matière" valeur={matiere ? matiere.titre : devis.matiere} />
              <Ligne
                label="Qualité"
                valeur={qualite ? `${qualite.titre} (${qualite.couche})` : devis.qualite}
              />
              <Ligne label="Couleur" valeur={devis.couleur ?? "À définir"} />
              <Ligne label="Quantité" valeur={String(devis.quantite)} />
              <Ligne
                label="Volume mesuré"
                valeur={
                  devis.volumeCm3 !== null ? (
                    `${devis.volumeCm3} cm³`
                  ) : (
                    <span className="text-muted">Non mesuré</span>
                  )
                }
              />
              <Ligne label="Estimation auto" valeur={formatPrix(devis.prixEstime)} />
              <Ligne
                label="Fichier STL"
                valeur={
                  lienStl ? (
                    <a
                      href={lienStl}
                      className="text-accent hover:underline"
                      download={devis.stlNom ?? undefined}
                    >
                      {devis.stlNom ?? "Télécharger"} ↓
                    </a>
                  ) : devis.stlKey ? (
                    <span className="text-muted">Lien indisponible ({devis.stlKey})</span>
                  ) : (
                    <span className="text-muted">Aucun fichier</span>
                  )
                }
              />
            </dl>
          </Card>

          <Card>
            <h2 className="mb-6 text-lg font-semibold">Historique</h2>
            <CommandeStatus statut={devis.statut} evenements={devis.evenements} />
          </Card>
        </div>

        <div className="space-y-6 lg:sticky lg:top-6">
          <Card>
            <h2 className="mb-5 text-lg font-semibold">Traiter la commande</h2>
            <CommandeActions
              id={devis.id}
              statutInitial={devis.statut}
              prixFinalInitial={devis.prixFinal}
              noteInitiale={devis.noteAdmin}
            />
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold">Lien de suivi client</h2>
            <a
              href={urlSuivi(devis.token)}
              target="_blank"
              rel="noreferrer noopener"
              className="text-xs break-all text-accent hover:underline"
            >
              {urlSuivi(devis.token)}
            </a>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Ligne({
  label,
  valeur,
}: {
  label: string;
  valeur: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-right font-medium">{valeur}</dd>
    </div>
  );
}
