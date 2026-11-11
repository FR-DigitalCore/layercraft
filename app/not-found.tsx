import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

/**
 * 404 maison. L'en-tête et les liens gardent le visiteur — et le robot —
 * sur le site, là où la page par défaut de Next est une impasse.
 */
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="conteneur flex min-h-[60vh] flex-col items-start justify-center py-20">
        <p className="font-mono text-sm font-bold text-accent">Erreur 404</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
          Cette page n&apos;existe pas
        </h1>
        <p className="mt-4 max-w-md text-muted">
          Le lien est peut-être périmé, ou l&apos;adresse comporte une faute de
          frappe.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/">Retour à l&apos;accueil</ButtonLink>
          <ButtonLink href="/devis" variante="secondaire">
            Demander un devis
          </ButtonLink>
        </div>
        <p className="mt-8 text-sm text-muted">
          Vous cherchiez peut-être{" "}
          <Link href="/galerie" className="font-medium text-accent hover:underline">
            les réalisations
          </Link>{" "}
          ou{" "}
          <Link href="/mon-compte" className="font-medium text-accent hover:underline">
            le suivi de vos demandes
          </Link>
          .
        </p>
      </main>
      <Footer />
    </>
  );
}
