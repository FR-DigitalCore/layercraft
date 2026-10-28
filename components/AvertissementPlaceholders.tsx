import { placeholdersRestants } from "@/lib/entreprise";

/**
 * Bandeau listant les informations légales encore non renseignées.
 * Il disparaît de lui-même une fois `lib/entreprise.ts` complété.
 */
export function AvertissementPlaceholders() {
  const manquants = placeholdersRestants();
  if (manquants.length === 0) return null;

  return (
    <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
      <p className="text-sm font-semibold text-amber-400">
        Page incomplète : {manquants.length} information
        {manquants.length > 1 ? "s" : ""} à renseigner avant la mise en ligne.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-muted">
        Ces mentions sont obligatoires pour un site marchand français. Complétez{" "}
        <code className="text-accent">lib/entreprise.ts</code> : ce bandeau
        disparaîtra tout seul.
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {manquants.map((champ) => (
          <li key={champ}>
            <code>{champ}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
