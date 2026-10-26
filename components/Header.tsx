import Link from "next/link";
import { site } from "@/lib/site";
import { ButtonLink } from "@/components/ui/Button";

const LIENS = [
  { href: "/", label: "Accueil" },
  { href: "/galerie", label: "Réalisations" },
  { href: "/#matieres", label: "Matières" },
  { href: "/#process", label: "Comment ça marche" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/85 backdrop-blur">
      <div className="conteneur flex h-16 items-center justify-between gap-6">
        <Link href="/" className="font-display text-lg font-bold tracking-tight">
          {site.nom}
          <span className="text-accent">.</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Navigation principale">
          {LIENS.map((lien) => (
            <Link
              key={lien.href}
              href={lien.href}
              className="text-sm text-muted transition-colors hover:text-text"
            >
              {lien.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/mon-compte"
            className="hidden text-sm text-muted transition-colors hover:text-text sm:block"
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
