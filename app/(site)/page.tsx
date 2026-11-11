import Link from "next/link";
import type { Metadata } from "next";
import { MATIERE_INFOS, MATIERES, QUALITE_INFOS, QUALITES } from "@/lib/prix";
import { listerRealisations } from "@/lib/realisations";
import { ButtonLink } from "@/components/ui/Button";
import { Card, TitreSection } from "@/components/ui/Card";
import { CarteRealisation } from "@/components/GalerieGrid";
import { JsonLdFaq, JsonLdService } from "@/components/JsonLd";
import { FAQ } from "@/lib/faq";

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
      <JsonLdFaq questions={FAQ} />

      {/* En-tête documentaire : une phrase, puis les caractéristiques. Pas
          de halo ni de titre dont une moitié passe en couleur. */}
      <section className="trame border-b border-border-fort">
        <div className="conteneur grid gap-10 py-14 lg:grid-cols-[1.15fr_1fr] lg:py-20">
          <div>
            <p className="etiquette">Atelier d&apos;impression 3D — France</p>
            <h1 className="mt-4 max-w-2xl text-3xl leading-tight font-semibold text-balance sm:text-4xl">
              Pièces sur mesure imprimées en 3D, du fichier au colis.
            </h1>
            <p className="mt-5 max-w-xl leading-relaxed text-muted">
              Pièce de rechange introuvable, prototype, support technique.
              Envoyez un STL ou décrivez le besoin : modélisation, choix de
              matière et impression par un interlocuteur unique.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/devis">Demander un devis</ButtonLink>
              <ButtonLink href="/galerie" variante="secondaire">
                Voir les réalisations
              </ButtonLink>
            </div>
          </div>

          {/* Fiche technique plutôt que bandeau de chiffres décoratifs. */}
          <dl className="divide-y divide-border border border-border bg-surface">
            {[
              ["Délai de réponse", "24–48 h ouvrées"],
              ["Matières au catalogue", "PLA · PETG · ASA · TPU"],
              ["Hauteur de couche", "0,10 – 0,30 mm"],
              ["Volume maximal", "256 × 256 × 256 mm"],
              ["Fichier accepté", "STL, 50 Mo"],
              ["Expédition", "France métropolitaine et Corse"],
            ].map(([label, valeur]) => (
              <div
                key={label}
                className="flex items-baseline justify-between gap-4 px-4 py-3"
              >
                <dt className="etiquette">{label}</dt>
                <dd className="chiffre text-sm font-medium">{valeur}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Procédé */}
      <section id="process" className="border-b border-border scroll-mt-16">
        <div className="conteneur py-14">
          <TitreSection
            surtitre="Procédé"
            titre="Trois étapes, aucune compétence technique requise"
          />
          <ol className="mt-10 grid border border-border bg-surface md:grid-cols-3 md:divide-x divide-border">
            {ETAPES.map((etape) => (
              <li key={etape.numero} className="border-b border-border p-6 md:border-b-0">
                <span className="chiffre text-xs font-semibold text-accent">
                  {etape.numero}
                </span>
                <h3 className="mt-3 font-semibold">{etape.titre}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{etape.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Matières — tableau comparatif, pas quatre cartes */}
      <section id="matieres" className="border-b border-border scroll-mt-16">
        <div className="conteneur py-14">
          <TitreSection
            surtitre="Matières"
            titre="La bonne matière pour le bon usage"
            chapeau="Pas sûr de votre choix ? Décrivez l'usage de la pièce dans votre demande, on vous oriente."
          />
          <div className="mt-10 overflow-x-auto border border-border bg-surface">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b border-border-fort">
                  <th className="etiquette px-4 py-3 text-left">Matière</th>
                  <th className="etiquette px-4 py-3 text-left">Caractéristique</th>
                  <th className="etiquette px-4 py-3 text-left">Usages typiques</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MATIERES.map((matiere) => {
                  const infos = MATIERE_INFOS[matiere];
                  return (
                    <tr key={matiere}>
                      <td className="chiffre px-4 py-4 font-semibold text-accent align-top">
                        {infos.titre}
                      </td>
                      <td className="px-4 py-4 align-top">{infos.resume}</td>
                      <td className="px-4 py-4 align-top text-muted">{infos.usages}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 overflow-x-auto border border-border bg-surface">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b border-border-fort">
                  <th className="etiquette px-4 py-3 text-left">Finition</th>
                  <th className="etiquette px-4 py-3 text-left">Couche</th>
                  <th className="etiquette px-4 py-3 text-left">Rendu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {QUALITES.map((qualite) => {
                  const infos = QUALITE_INFOS[qualite];
                  return (
                    <tr key={qualite}>
                      <td className="px-4 py-4 font-semibold align-top">{infos.titre}</td>
                      <td className="chiffre px-4 py-4 align-top">{infos.couche}</td>
                      <td className="px-4 py-4 align-top text-muted">{infos.resume}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Réalisations */}
      <section className="border-b border-border">
        <div className="conteneur py-14">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <TitreSection surtitre="Réalisations" titre="Sorties d'atelier récentes" />
            <Link
              href="/galerie"
              className="font-mono text-xs tracking-wide text-accent uppercase hover:underline"
            >
              Toute la galerie →
            </Link>
          </div>

          {dernieres.length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        </div>
      </section>

      {/* Questions fréquentes */}
      <section id="faq" className="border-b border-border scroll-mt-16">
        <div className="conteneur py-14">
          <TitreSection surtitre="Questions fréquentes" titre="Ce qu'on nous demande le plus" />
          {/* Réponses toujours visibles : le balisage FAQPage impose que le
              visiteur lise exactement ce que le moteur indexe. */}
          <dl className="mt-10 grid border border-border bg-surface md:grid-cols-2">
            {FAQ.map(({ question, reponse }) => (
              <div key={question} className="border-b border-border p-6 md:odd:border-r">
                <dt className="font-semibold">{question}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">{reponse}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Demande de devis */}
      <section className="conteneur py-14">
        <div className="flex flex-col items-start gap-6 border border-border-fort bg-surface p-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="etiquette">Devis gratuit</p>
            <h2 className="mt-2 text-xl font-semibold">Un projet en tête ?</h2>
            <p className="mt-2 text-sm text-muted">
              Sans engagement, réponse sous 24 à 48 h ouvrées.
            </p>
          </div>
          <ButtonLink href="/devis">Demander un devis</ButtonLink>
        </div>
      </section>
    </>
  );
}
