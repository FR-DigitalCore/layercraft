import type { Metadata } from "next";
import { site } from "@/lib/site";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = {
  title: "Mentions légales",
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <Prose titre="Mentions légales">
      <p className="text-sm text-amber-400">
        Modèle à compléter avant mise en ligne : raison sociale, statut juridique,
        SIRET, TVA, directeur de la publication et hébergeur doivent correspondre à la
        réalité de l&apos;entreprise.
      </p>

      <h2>Éditeur du site</h2>
      <p>
        {site.nom}
        <br />
        {site.adresse.rue}, {site.adresse.codePostal} {site.adresse.ville}
        <br />
        SIRET : {site.siret}
        <br />
        Email : {site.email} — Téléphone : {site.telephone}
      </p>

      <h2>Directeur de la publication</h2>
      <p>À compléter (nom du responsable légal).</p>

      <h2>Hébergement</h2>
      <p>
        Site hébergé sur un serveur dédié. À compléter : nom, adresse et téléphone de
        l&apos;hébergeur.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les contenus de ce site (textes, photographies des réalisations, éléments
        graphiques) sont la propriété de {site.nom}, sauf mention contraire. Toute
        reproduction sans autorisation est interdite.
      </p>
      <p>
        Les fichiers 3D transmis par les clients restent leur propriété exclusive. Ils ne
        sont utilisés que pour l&apos;exécution de la commande et ne sont ni revendus, ni
        publiés, ni réutilisés à d&apos;autres fins.
      </p>

      <h2>Responsabilité</h2>
      <p>
        Les estimations de prix affichées par le configurateur sont indicatives et non
        contractuelles. Seul le devis transmis par email engage {site.nom}.
      </p>
    </Prose>
  );
}
