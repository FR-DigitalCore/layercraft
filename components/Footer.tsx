import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface">
      <div className="conteneur grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold">
            {site.nom}
            <span className="text-accent">.</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">{site.baseline}</p>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold">Contact</p>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <a href={`mailto:${site.email}`} className="hover:text-text">
                {site.email}
              </a>
            </li>
            <li>
              <a href={`tel:${site.telephone.replace(/\s/g, "")}`} className="hover:text-text">
                {site.telephone}
              </a>
            </li>
            <li>
              {site.adresse.rue}
              <br />
              {site.adresse.codePostal} {site.adresse.ville}
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold">Zone de livraison</p>
          <p className="text-sm leading-relaxed text-muted">{site.zone}</p>
          <a
            href={site.mapsUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
          >
            Voir sur Google Maps →
          </a>
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold">Le site</p>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href="/galerie" className="hover:text-text">
                Réalisations
              </Link>
            </li>
            <li>
              <Link href="/devis" className="hover:text-text">
                Demander un devis
              </Link>
            </li>
            <li>
              <Link href="/mentions-legales" className="hover:text-text">
                Mentions légales
              </Link>
            </li>
            <li>
              <Link href="/confidentialite" className="hover:text-text">
                Politique de confidentialité
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="conteneur flex flex-col gap-2 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.nom}. Tous droits réservés.
          </p>
          <p>SIRET {site.siret}</p>
        </div>
      </div>
    </footer>
  );
}
