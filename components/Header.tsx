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
        {/* Logotype purement typographique : la chasse fixe et le filet
            disent le registre technique sans pictogramme. */}
        <Link href="/" className="flex items-baseline gap-2 font-mono">
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
