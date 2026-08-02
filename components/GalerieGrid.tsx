"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { RealisationAffichee } from "@/lib/realisations";
import { Badge } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

export function CarteRealisation({
  realisation,
}: {
  realisation: RealisationAffichee;
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-surface transition-colors hover:border-accent/40">
      <div className="relative aspect-4/3 overflow-hidden bg-surface-haut">
        <Image
          src={realisation.imageUrl}
          alt={realisation.titre}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          unoptimized
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{realisation.titre}</h3>
        {realisation.matiere && (
          <p className="mt-1 text-xs text-muted">{realisation.matiere}</p>
        )}
        {realisation.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">
            {realisation.description}
          </p>
        )}
        <Link
          href={{
            pathname: "/devis",
            query: realisation.matiere ? { matiere: realisation.matiere } : undefined,
          }}
          className="mt-4 inline-block text-sm font-medium text-accent hover:underline"
        >
          Commander ce type de pièce →
        </Link>
      </div>
    </article>
  );
}

export function GalerieGrid({
  realisations,
  tags,
}: {
  realisations: RealisationAffichee[];
  tags: string[];
}) {
  const [tagActif, setTagActif] = useState<string | null>(null);

  const visibles = useMemo(
    () =>
      tagActif
        ? realisations.filter((r) => r.tags.includes(tagActif))
        : realisations,
    [realisations, tagActif],
  );

  return (
    <>
      {tags.length > 0 && (
        <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label="Filtrer par tag">
          <BoutonFiltre actif={tagActif === null} onClick={() => setTagActif(null)}>
            Tout ({realisations.length})
          </BoutonFiltre>
          {tags.map((tag) => (
            <BoutonFiltre
              key={tag}
              actif={tagActif === tag}
              onClick={() => setTagActif(tag)}
            >
              {tag}
            </BoutonFiltre>
          ))}
        </div>
      )}

      {visibles.length > 0 ? (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibles.map((realisation) => (
            <div key={realisation.id}>
              <CarteRealisation realisation={realisation} />
              {realisation.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {realisation.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-10 rounded-xl border border-border bg-surface p-8 text-center text-sm text-muted">
          Aucune réalisation pour ce filtre.
        </p>
      )}
    </>
  );
}

function BoutonFiltre({
  actif,
  onClick,
  children,
}: {
  actif: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={actif}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
        actif
          ? "border-accent bg-accent text-white"
          : "border-border bg-surface text-muted hover:border-muted/60 hover:text-text",
      )}
    >
      {children}
    </button>
  );
}
