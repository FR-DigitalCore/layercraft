import type { Metadata } from "next";
import { site } from "@/lib/site";
import { adresseSiege, entreprise } from "@/lib/entreprise";
import { Prose } from "@/components/Prose";
import { AvertissementPlaceholders } from "@/components/AvertissementPlaceholders";

export const metadata: Metadata = {
  title: "Mentions légales",
  description: `Informations légales de ${site.nom} : éditeur, hébergeur, propriété intellectuelle.`,
  alternates: { canonical: "/mentions-legales" },
};

export default function MentionsLegalesPage() {
  return (
    <Prose titre="Mentions légales" avant={<AvertissementPlaceholders />}>
      <h2>Éditeur du site</h2>
      <p>
        {entreprise.raisonSociale}, {entreprise.formeJuridique}
        {entreprise.capitalSocial ? ` au capital de ${entreprise.capitalSocial}` : ""}.
        <br />
        Siège social : {adresseSiege()}
        <br />
        SIRET : {entreprise.siret}
        <br />
        RCS : {entreprise.rcs}
        <br />
        {entreprise.assujettiTva ? (
          <>TVA intracommunautaire : {entreprise.tvaIntracom}</>
        ) : (
          <>TVA non applicable, article 293 B du code général des impôts.</>
        )}
      </p>
      <p>
        Contact : <a href={`mailto:${site.email}`}>{site.email}</a> —{" "}
        <a href={`tel:${site.telephone.replace(/\s/g, "")}`}>{site.telephone}</a>
      </p>

      <h2>Directeur de la publication</h2>
      <p>{entreprise.directeurPublication}</p>

      <h2>Hébergement</h2>
      <p>
        {entreprise.hebergeur.nom}
        <br />
        {entreprise.hebergeur.adresse}
        <br />
        {entreprise.hebergeur.telephone}
      </p>

      <h2>Activité</h2>
      <p>
        {site.nom} propose un service d&apos;impression 3D à la demande :
        conception, impression et expédition de pièces sur mesure. Les commandes
        sont passées en ligne, après établissement d&apos;un devis. La zone
        desservie est {site.zone}.
      </p>

      <h2>Propriété intellectuelle</h2>
      <p>
        Les textes, photographies des réalisations et éléments graphiques de ce
        site sont la propriété de {entreprise.raisonSociale}, sauf mention
        contraire. Toute reproduction, même partielle, sans autorisation écrite
        préalable est interdite.
      </p>
      <p>
        Les fichiers 3D transmis par les clients restent leur propriété
        exclusive. Ils ne sont utilisés que pour l&apos;exécution de la commande
        et ne sont ni revendus, ni publiés, ni réutilisés à d&apos;autres fins.
        Le client garantit disposer des droits nécessaires sur les modèles
        qu&apos;il transmet, et s&apos;interdit de commander la fabrication de
        pièces contrefaisantes ou dont la fabrication est réglementée ou
        interdite.
      </p>

      <h2>Responsabilité</h2>
      <p>
        Les estimations de prix affichées par le configurateur sont indicatives
        et non contractuelles : elles reposent sur un calcul automatique à partir
        du volume du fichier et ne tiennent pas compte des contraintes
        particulières d&apos;une pièce. Seul le devis transmis par email engage{" "}
        {entreprise.raisonSociale}.
      </p>
      <p>
        {entreprise.raisonSociale} met tout en œuvre pour assurer
        l&apos;exactitude des informations publiées et la disponibilité du site,
        sans pouvoir le garantir de façon absolue.
      </p>

      {entreprise.assurance && (
        <>
          <h2>Assurance professionnelle</h2>
          <p>{entreprise.assurance}</p>
        </>
      )}

      <h2>Litiges</h2>
      <p>
        Le présent site est soumis au droit français. En cas de litige, et après
        une tentative de résolution amiable, les tribunaux français sont seuls
        compétents. Les modalités de recours au médiateur de la consommation
        figurent dans les{" "}
        <a href="/cgv">conditions générales de vente</a>.
      </p>
    </Prose>
  );
}
