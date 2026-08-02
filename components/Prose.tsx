import type { ReactNode } from "react";

/**
 * Mise en page des pages de texte long (mentions légales, confidentialité).
 * Styles au niveau du conteneur pour éviter d'ajouter le plugin typography.
 */
export function Prose({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="conteneur max-w-3xl py-16">
      <h1 className="text-3xl font-bold sm:text-4xl">{titre}</h1>
      <div
        className="mt-10 space-y-4 text-sm leading-relaxed text-muted
          [&_a]:text-accent [&_a:hover]:underline
          [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text
          [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5"
      >
        {children}
      </div>
    </div>
  );
}
