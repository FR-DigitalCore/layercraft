import Link from "next/link";
import type { Metadata } from "next";
import { MATIERE_INFOS, MATIERES } from "@/lib/prix";
import { listerRealisations } from "@/lib/realisations";
import { ButtonLink } from "@/components/ui/Button";
import { Card, TitreSection } from "@/components/ui/Card";
import { CarteRealisation } from "@/components/GalerieGrid";
import { JsonLdService } from "@/components/JsonLd";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Régénération périodique : la galerie bouge peu, inutile de taper la DB à chaque visite.
export const revalidate = 300;

const ETAPES = [
  {
    numero: "01",
    titre: "Vous envoyez votre pièce",
    texte:
      "Un fichier STL sous la main ? Déposez-le. Sinon, décrivez simplement ce dont vous avez besoin : on s'occupe de la modélisation.",
  },
  {
    numero: "02",
    titre: "On vous chiffre le travail",
    texte:
      "Réponse sous 24 à 48 h ouvrées avec un devis ferme, le choix de matière conseillé et le délai réel d'impression.",
  },
  {
    numero: "03",
    titre: "Vous recevez la pièce",
    texte:
      "Expédition partout en France, ou retrait sur place. Vous suivez l'avancement en ligne à chaque étape.",
  },
];

export default async function HomePage() {
  const dernieres = await listerRealisations(4);

  return (
    <>
      <JsonLdService />

      {/* Hero */}
      <section className="fond-hero border-b border-border">
        <div className="conteneur py-20 sm:py-28">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
            <span className="size-1.5 rounded-full bg-accent" />
            Devis en ligne — livraison partout en France
          </p>
          <h1 className="max-w-3xl text-4xl leading-[1.1] font-bold text-balance sm:text-6xl">
            Votre pièce imprimée en 3D,{" "}
            <span className="text-accent">même sans savoir modéliser</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Pièce de rechange introuvable, prototype, support sur mesure : envoyez votre
            fichier ou décrivez votre besoin, on s&apos;occupe du reste. Conception,
            impression et conseil technique par un interlocuteur unique.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <ButtonLink href="/devis" taille="lg">
              Demander un devis
            </ButtonLink>
            <ButtonLink href="/galerie" taille="lg" variante="secondaire">
              Voir les réalisations
            </ButtonLink>
          </div>
          <dl className="mt-14 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              ["24-48 h", "Réponse au devis"],
              ["4", "Matières au catalogue"],
              ["0,1 mm", "Finition la plus fine"],
              ["France", "Zone de livraison"],
            ].map(([valeur, label]) => (
              <div key={label}>
                <dt className="font-display text-2xl font-bold">{valeur}</dt>
                <dd className="mt-1 text-xs text-muted">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Comment ça marche */}
      <section id="process" className="conteneur scroll-mt-20 py-20">
        <TitreSection
          surtitre="Comment ça marche"
          titre="Trois étapes, aucune compétence technique requise"
        />
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {ETAPES.map((etape) => (
            <li key={etape.numero}>
              <Card className="h-full">
                <span className="font-display text-sm font-bold text-accent">
                  {etape.numero}
                </span>
                <h3 className="mt-3 text-lg font-semibold">{etape.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{etape.texte}</p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      {/* Aperçu galerie */}
      <section className="conteneur py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <TitreSection
            surtitre="Réalisations"
            titre="Ce qui est sorti de l'atelier récemment"
          />
          <Link
            href="/galerie"
            className="text-sm font-medium text-accent hover:underline"
          >
            Toute la galerie →
          </Link>
        </div>

        {dernieres.length > 0 ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {dernieres.map((realisation) => (
              <CarteRealisation key={realisation.id} realisation={realisation} />
            ))}
          </div>
        ) : (
          <Card className="mt-10 text-center text-sm text-muted">
            Les premières réalisations arrivent bientôt. En attendant,{" "}
            <Link href="/devis" className="font-medium text-accent hover:underline">
              parlez-nous de votre projet
            </Link>
            .
          </Card>
        )}
      </section>

      {/* Matières */}
      <section id="matieres" className="conteneur scroll-mt-20 py-20">
        <TitreSection
          surtitre="Matières"
          titre="La bonne matière pour le bon usage"
          chapeau="Pas sûr de votre choix ? Décrivez l'usage de la pièce dans votre demande, on vous oriente."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {MATIERES.map((matiere) => {
            const infos = MATIERE_INFOS[matiere];
            return (
              <Card key={matiere} className="flex h-full flex-col">
                <h3 className="font-display text-xl font-bold text-accent">
                  {infos.titre}
                </h3>
                <p className="mt-3 text-sm leading-relaxed">{infos.resume}</p>
                <p className="mt-auto pt-4 text-xs leading-relaxed text-muted">
                  {infos.usages}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA final */}
      <section className="conteneur pb-4">
        <Card className="fond-hero flex flex-col items-start gap-6 p-10 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Un projet en tête ?</h2>
            <p className="mt-2 text-sm text-muted">
              Devis gratuit et sans engagement, réponse sous 48 h ouvrées.
            </p>
          </div>
          <ButtonLink href="/devis" taille="lg">
            Demander un devis
          </ButtonLink>
        </Card>
      </section>
    </>
  );
}
