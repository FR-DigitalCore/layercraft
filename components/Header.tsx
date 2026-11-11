import Link from "next/link";
import { site } from "@/lib/site";
import { ButtonLink } from "@/components/ui/Button";

const LIENS = [
  { href: "/", label: "Accueil" },
  { href: "/galerie", label: "Réalisations" },
  { href: "/#matieres", label: "Matières" },
  { href: "/#process", label: "Procédé" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-fort bg-bg/95 backdrop-blur">
      <div className="conteneur flex h-14 items-center justify-between gap-6">
        {/* Marque en ligne plutôt qu'en fichier : nette à toute taille, sans
            requête supplémentaire. La source reste design/marque.svg. */}
        <Link href="/" className="flex items-center gap-2.5 font-mono">
          <svg
            viewBox="0 0 120 120"
            aria-hidden="true"
            className="size-9 shrink-0"
          >
            <rect x="4" y="4" width="112" height="112" fill="#eef0f1" stroke="#15181b" strokeWidth="7" />
            <path d="M34 24h52l-11 30H45z" fill="none" stroke="#15181b" strokeWidth="7" strokeLinejoin="miter" />
            <path d="M53 54h14v9H53z" fill="#15181b" />
            <text
              x="60"
              y="95"
              fontFamily="var(--font-plex-mono), monospace"
              fontSize="30"
              fontWeight="600"
              fill="#0b4f9e"
              textAnchor="middle"
            >
              LC
            </text>
            <path d="M32 106h56" stroke="#15181b" strokeWidth="7" strokeLinecap="square" />
          </svg>
          <span className="text-base font-semibold tracking-tight">{site.nom}</span>
          <span className="hidden text-[0.6875rem] tracking-[0.18em] text-muted uppercase sm:inline">
            impression 3D
          </span>
        </Link>

        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Navigation principale"
        >
          {LIENS.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className="font-mono text-xs tracking-wide text-muted uppercase transition-colors hover:text-text"
            >
              {lien.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/mon-compte"
            className="hidden font-mono text-xs tracking-wide text-muted uppercase transition-colors hover:text-text sm:block"
          >
            Mon compte
          </Link>
          <ButtonLink href="/devis" taille="sm">
            Demander un devis
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
