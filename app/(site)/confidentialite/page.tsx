import type { Metadata } from "next";
import { site } from "@/lib/site";
import { adresseSiege, entreprise } from "@/lib/entreprise";
import { Prose } from "@/components/Prose";
import { AvertissementPlaceholders } from "@/components/AvertissementPlaceholders";
import { umamiActif } from "@/lib/analytics";

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: `Comment ${site.nom} collecte, utilise et conserve vos données personnelles.`,
  alternates: { canonical: "/confidentialite" },
};

export default function ConfidentialitePage() {
  return (
    <Prose titre="Politique de confidentialité" avant={<AvertissementPlaceholders />}>
      <h2>Responsable de traitement</h2>
      <p>
        {entreprise.raisonSociale}, {adresseSiege()}.
        <br />
        Contact : <a href={`mailto:${site.email}`}>{site.email}</a>
      </p>

      <h2>Données collectées et finalités</h2>
      <p>
        Nous ne collectons que ce qui est nécessaire à l&apos;exécution de votre
        commande. Aucune donnée n&apos;est utilisée à des fins publicitaires.
      </p>
      <ul>
        <li>
          <strong>Demande de devis</strong> — nom, adresse email, téléphone
          (facultatif), message, fichier 3D et configuration d&apos;impression.
          Nécessaires pour chiffrer et réaliser la pièce.
        </li>
        <li>
          <strong>Livraison</strong> — adresse postale ou point relais choisi.
          Transmis au transporteur pour l&apos;acheminement.
        </li>
        <li>
          <strong>Compte client</strong> — adresse email seule. La connexion se
          fait par lien à usage unique : nous ne stockons aucun mot de passe.
        </li>
        <li>
          <strong>Paiement</strong> — traité par Stripe. Les coordonnées
          bancaires ne transitent pas par nos serveurs et ne sont jamais
          enregistrées chez nous ; nous ne conservons qu&apos;un identifiant de
          transaction.
        </li>
      </ul>

      <h2>Base légale</h2>
      <p>
        L&apos;exécution de mesures précontractuelles et du contrat
        (art. 6.1.b du RGPD) pour les devis et les commandes. Le respect
        d&apos;obligations légales (art. 6.1.c) pour la conservation comptable.
      </p>

      <h2>Durées de conservation</h2>
      <ul>
        <li>Demandes sans suite : 12 mois après le dernier échange.</li>
        <li>
          Commandes réalisées : 10 ans, au titre des obligations comptables.
        </li>
        <li>
          Fichiers 3D : 12 mois après livraison, puis suppression du stockage —
          ou immédiatement sur simple demande de votre part.
        </li>
        <li>
          Liens de connexion : 15 minutes, et détruits dès la première
          utilisation.
        </li>
      </ul>

      <h2>Destinataires</h2>
      <p>
        Vos données ne sont ni vendues, ni louées, ni cédées. Elles sont
        traitées par {entreprise.raisonSociale} et par les seuls sous-traitants
        nécessaires au service :
      </p>
      <ul>
        <li>
          <strong>{entreprise.hebergeur.nom}</strong> — hébergement du site et
          de la base de données.
        </li>
        <li>
          <strong>Stripe Payments Europe</strong> — traitement des paiements.
        </li>
        <li>
          <strong>Resend</strong> — envoi des emails transactionnels.
        </li>
        <li>
          <strong>Le transporteur choisi</strong> — nom et adresse de livraison
          uniquement.
        </li>
      </ul>
      <p>
        Les fichiers 3D sont stockés sur notre propre serveur, dans un espace
        non public accessible uniquement par liens temporaires signés.
      </p>

      <h2>Cookies et mesure d&apos;audience</h2>
      <p>
        Ce site ne dépose <strong>aucun cookie publicitaire ni traceur
        tiers</strong>. Seul un cookie de session technique est utilisé, pour
        vous maintenir connecté à votre espace client ou à
        l&apos;administration. Il est strictement nécessaire au fonctionnement
        du site et ne requiert pas votre consentement.
      </p>
      {umamiActif() ? (
        <p>
          La fréquentation est mesurée avec <strong>Umami</strong>, hébergé par
          nos soins. Cet outil ne dépose pas de cookie, n&apos;utilise pas
          d&apos;identifiant persistant et ne permet pas de vous reconnaître
          d&apos;une visite à l&apos;autre : les adresses IP sont anonymisées et
          jamais enregistrées. Aucune donnée n&apos;est transmise à un tiers.
          Pour ces raisons, cette mesure est exemptée de consentement au sens
          des recommandations de la CNIL. Les pages de suivi de commande et
          votre espace client en sont exclus, afin qu&apos;aucune référence de
          commande ne figure dans les statistiques.
        </p>
      ) : (
        <p>Aucun outil de mesure d&apos;audience n&apos;est actif sur ce site.</p>
      )}

      <h2>Transferts hors Union européenne</h2>
      <p>
        Le site et la base de données sont hébergés en Suisse, chez{" "}
        {entreprise.hebergeur.nom}. La Suisse bénéficie d&apos;une décision
        d&apos;adéquation de la Commission européenne : ce transfert
        n&apos;appelle aucune garantie supplémentaire.
      </p>
      <p>
        Les paiements sont traités par Stripe Payments Europe, au sein de
        l&apos;Union européenne. L&apos;envoi des emails passe par Resend, dont
        les serveurs sont situés aux États-Unis ; ce transfert est encadré par
        les clauses contractuelles types de la Commission européenne prévues à
        son accord de traitement des données.
      </p>

      <h2>Sécurité</h2>
      <p>
        Les échanges avec le site sont chiffrés (HTTPS). L&apos;accès à
        l&apos;administration est restreint et authentifié. Les fichiers que
        vous nous confiez ne sont jamais exposés publiquement.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification,
        d&apos;effacement, de limitation, d&apos;opposition et de portabilité de
        vos données. Pour l&apos;exercer, écrivez à{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a> ; une réponse vous sera
        apportée sous un mois.
      </p>
      <p>
        Si la réponse ne vous satisfait pas, vous pouvez saisir la Commission
        nationale de l&apos;informatique et des libertés :{" "}
        <a href="https://www.cnil.fr/fr/plaintes" rel="noreferrer noopener">
          cnil.fr/fr/plaintes
        </a>
        .
      </p>
    </Prose>
  );
}
