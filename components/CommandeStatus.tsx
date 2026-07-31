import type { EvenementDevis, Statut } from "@prisma/client";
import { ETAPES_TIMELINE, formatDate, STATUT_INFOS } from "@/lib/statuts";
import { cn } from "@/lib/cn";

/**
 * Timeline publique. Chaque étape porte la date de son passage
 * lorsqu'un évènement correspondant existe.
 */
export function CommandeStatus({
  statut,
  evenements,
}: {
  statut: Statut;
  evenements: Pick<EvenementDevis, "statut" | "createdAt" | "commentaire">[];
}) {
  if (statut === "ANNULE") {
    const annulation = evenements.find((e) => e.statut === "ANNULE");
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <p className="font-semibold text-red-300">{STATUT_INFOS.ANNULE.label}</p>
        <p className="mt-1 text-sm text-muted">
          {annulation ? formatDate(annulation.createdAt) : null}
        </p>
        {annulation?.commentaire && (
          <p className="mt-3 text-sm leading-relaxed">{annulation.commentaire}</p>
        )}
      </div>
    );
  }

  const indexActuel = ETAPES_TIMELINE.indexOf(statut);

  return (
    <ol className="relative space-y-0">
      {ETAPES_TIMELINE.map((etape, index) => {
        const infos = STATUT_INFOS[etape];
        const evenement = evenements.find((e) => e.statut === etape);
        const franchie = index <= indexActuel;
        const actuelle = index === indexActuel;
        const derniere = index === ETAPES_TIMELINE.length - 1;

        return (
          <li key={etape} className="relative flex gap-4 pb-8 last:pb-0">
            {!derniere && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-5 left-[0.4375rem] h-full w-px",
                  franchie && index < indexActuel ? "bg-accent" : "bg-border",
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                "relative mt-1 size-3.5 shrink-0 rounded-full border-2",
                actuelle
                  ? "border-accent bg-accent ring-4 ring-accent/20"
                  : franchie
                    ? "border-accent bg-accent"
                    : "border-border bg-surface",
              )}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "font-medium",
                  franchie ? "text-text" : "text-muted",
                )}
              >
                {infos.label}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {evenement ? formatDate(evenement.createdAt) : infos.description}
              </p>
              {evenement?.commentaire && (
                <p className="mt-2 rounded-lg border border-border bg-surface-haut p-3 text-sm leading-relaxed">
                  {evenement.commentaire}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
