import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/prix";
import { estStatutValide, formatDateCourte, STATUTS, STATUT_INFOS } from "@/lib/statuts";
import { Badge, Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const PAR_PAGE = 25;

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; page?: string }>;
}) {
  const { statut: statutBrut, page: pageBrute } = await searchParams;

  const statut = estStatutValide(statutBrut) ? statutBrut : undefined;
  const page = Math.max(1, Number(pageBrute ?? 1) || 1);
  const where = statut ? { statut } : {};

  const [devis, total, parStatut] = await Promise.all([
    prisma.devis.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAR_PAGE,
      take: PAR_PAGE,
    }),
    prisma.devis.count({ where }),
    prisma.devis.groupBy({ by: ["statut"], _count: { _all: true } }),
  ]);

  const compteurs = new Map(parStatut.map((c) => [c.statut, c._count._all]));
  const totalGeneral = parStatut.reduce((somme, c) => somme + c._count._all, 0);
  const pages = Math.max(1, Math.ceil(total / PAR_PAGE));

  return (
    <div className="conteneur py-10">
      <h1 className="text-2xl font-bold">Commandes</h1>
      <p className="mt-1 text-sm text-muted">
        {totalGeneral} demande{totalGeneral > 1 ? "s" : ""} au total
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <FiltreStatut actif={!statut} href="/admin" label={`Toutes (${totalGeneral})`} />
        {STATUTS.map((valeur) => (
          <FiltreStatut
            key={valeur}
            actif={statut === valeur}
            href={`/admin?statut=${valeur}`}
            label={`${STATUT_INFOS[valeur].label} (${compteurs.get(valeur) ?? 0})`}
          />
        ))}
      </div>

      {devis.length === 0 ? (
        <Card className="mt-8 text-center text-sm text-muted">
          Aucune commande pour ce filtre.
        </Card>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="bg-surface text-left text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Config</th>
                <th className="px-4 py-3 font-medium">Fichier</th>
                <th className="px-4 py-3 font-medium">Prix</th>
                <th className="px-4 py-3 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {devis.map((d) => (
                <tr
                  key={d.id}
                  className="border-t border-border transition-colors hover:bg-surface"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-muted">
                    {formatDateCourte(d.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/commandes/${d.id}`}
                      className="font-medium hover:text-accent"
                    >
                      {d.nom}
                    </Link>
                    <span className="block text-xs text-muted">{d.email}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted">
                    {d.matiere} · {d.qualite} · ×{d.quantite}
                  </td>
                  <td className="max-w-40 truncate px-4 py-3 text-muted">
                    {d.stlNom ?? "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {d.prixFinal !== null ? (
                      <span className="font-semibold text-accent">
                        {formatPrix(d.prixFinal)}
                      </span>
                    ) : (
                      <span className="text-muted">≈ {formatPrix(d.prixEstime)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={STATUT_INFOS[d.statut].couleur}>
                      {STATUT_INFOS[d.statut].label}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-between text-sm">
          <Pagination
            actif={page > 1}
            href={`/admin?${new URLSearchParams({ ...(statut ? { statut } : {}), page: String(page - 1) })}`}
            label="← Précédent"
          />
          <span className="text-muted">
            Page {page} / {pages}
          </span>
          <Pagination
            actif={page < pages}
            href={`/admin?${new URLSearchParams({ ...(statut ? { statut } : {}), page: String(page + 1) })}`}
            label="Suivant →"
          />
        </div>
      )}
    </div>
  );
}

function FiltreStatut({
  actif,
  href,
  label,
}: {
  actif: boolean;
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs transition-colors",
        actif
          ? "border-accent bg-accent text-white"
          : "border-border bg-surface text-muted hover:text-text",
      )}
    >
      {label}
    </Link>
  );
}

function Pagination({
  actif,
  href,
  label,
}: {
  actif: boolean;
  href: string;
  label: string;
}) {
  if (!actif) return <span className="text-muted/50">{label}</span>;
  return (
    <Link href={href} className="text-accent hover:underline">
      {label}
    </Link>
  );
}
