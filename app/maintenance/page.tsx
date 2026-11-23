import type { Metadata } from "next";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Site en cours de refonte",
  // Pas d'indexation : cette page est temporaire et ne doit pas se
  // substituer au site dans les résultats de recherche.
  robots: { index: false, follow: false },
};

/**
 * Page de maintenance. Volontairement sans nom commercial ni logotype :
 * elle est affichée pendant le changement de dénomination, et le site ne
 * doit plus porter l'ancien signe.
 *
 * Elle s'active par la variable MAINTENANCE (voir next.config.ts), qui
 * réécrit vers elle toutes les pages publiques.
 */
export default function MaintenancePage() {
  return (
    <main className="trame flex min-h-screen items-center justify-center px-5 py-20">
      <div className="w-full max-w-lg border border-border-fort bg-surface p-8 sm:p-10">
        <p className="etiquette">Impression 3D à la demande — France</p>

        <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">
          Site en cours de refonte
        </h1>

        <p className="mt-5 leading-relaxed text-muted">
          Le service change de nom et fait peau neuve. Les demandes de devis
          sont momentanément suspendues, le temps de la bascule.
        </p>

        <dl className="mt-8 divide-y divide-border border border-border">
          <div className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="etiquette">Retour prévu</dt>
            <dd className="chiffre text-sm font-medium">décembre 2026</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 px-4 py-3">
            <dt className="etiquette">Devis en cours</dt>
            <dd className="chiffre text-sm font-medium">suivis normalement</dd>
          </div>
        </dl>

        <p className="mt-8 text-sm leading-relaxed text-muted">
          Un projet, une question, un devis déjà déposé ? Écrivez à{" "}
          <a
            href={`mailto:${site.email}`}
            className="font-medium text-accent hover:underline"
          >
            {site.email}
          </a>
          , les messages sont relevés.
        </p>
      </div>
    </main>
  );
}
