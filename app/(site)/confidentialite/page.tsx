import type { Metadata } from "next";
import { site } from "@/lib/site";
import { Prose } from "@/components/Prose";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  alternates: { canonical: "/confidentialite" },
};

export default function ConfidentialitePage() {
  return (
    <Prose titre="Politique de confidentialité">
      <p className="text-sm text-amber-400">
        Modèle à relire et compléter avant mise en ligne (durées de conservation et
        sous-traitants doivent refléter votre configuration réelle).
      </p>

      <h2>Responsable de traitement</h2>
      <p>
        {site.nom}, {site.adresse.rue}, {site.adresse.codePostal} {site.adresse.ville} —{" "}
        {site.email}
      </p>

      <h2>Données collectées</h2>
      <p>Via le formulaire de devis :</p>
      <ul>
        <li>nom, adresse email, numéro de téléphone (facultatif) ;</li>
        <li>message libre et description de la pièce ;</li>
        <li>fichier 3D transmis (STL) ;</li>
        <li>configuration d&apos;impression (matière, qualité, couleur, quantité).</li>
      </ul>

      <h2>Finalités et base légale</h2>
      <p>
        Ces données servent exclusivement à établir le devis, exécuter la commande et
        assurer le suivi. La base légale est l&apos;exécution de mesures précontractuelles
        et du contrat (art. 6.1.b RGPD).
      </p>

      <h2>Durée de conservation</h2>
      <ul>
        <li>Demandes sans suite : 12 mois après le dernier échange.</li>
        <li>
          Commandes réalisées : 10 ans, au titre des obligations comptables légales.
        </li>
        <li>
          Fichiers 3D : 12 mois après livraison, puis suppression du stockage — sauf
          demande de suppression anticipée.
        </li>
      </ul>

      <h2>Destinataires</h2>
      <p>
        Les données ne sont ni vendues ni cédées. Elles sont traitées par {site.nom} et
        par les sous-traitants techniques strictement nécessaires : l&apos;hébergeur du
        serveur et le prestataire d&apos;envoi d&apos;emails transactionnels (Resend). Les
        fichiers 3D sont stockés sur le serveur de {site.nom}, dans un espace non public.
      </p>

      <h2>Cookies</h2>
      <p>
        Le site ne dépose aucun cookie publicitaire ni traceur d&apos;audience. Seul un
        cookie de session technique est utilisé pour l&apos;espace d&apos;administration.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification, d&apos;effacement, de
        limitation et de portabilité de vos données. Pour l&apos;exercer, écrivez à{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>. En cas de désaccord, vous pouvez
        saisir la CNIL (cnil.fr).
      </p>
    </Prose>
  );
}
