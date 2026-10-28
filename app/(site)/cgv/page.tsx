import type { Metadata } from "next";
import { site } from "@/lib/site";
import { adresseSiege, entreprise } from "@/lib/entreprise";
import { Prose } from "@/components/Prose";
import { AvertissementPlaceholders } from "@/components/AvertissementPlaceholders";

export const metadata: Metadata = {
  title: "Conditions générales de vente",
  description: `Conditions générales de vente de ${site.nom} : commande, prix, paiement, livraison, rétractation, garanties.`,
  alternates: { canonical: "/cgv" },
};

export default function CgvPage() {
  return (
    <Prose
      titre="Conditions générales de vente"
      avant={<AvertissementPlaceholders />}
    >
      <p>
        Les présentes conditions régissent les ventes conclues sur{" "}
        {site.url} par {entreprise.raisonSociale}, {adresseSiege()}. Toute
        commande vaut acceptation sans réserve des présentes.
      </p>

      <h2>1. Objet</h2>
      <p>
        {entreprise.raisonSociale} réalise des pièces par impression 3D à la
        demande, à partir d&apos;un fichier fourni par le client ou d&apos;une
        description conduisant à une modélisation sur mesure.
      </p>

      <h2>2. Devis et formation du contrat</h2>
      <p>
        L&apos;estimation affichée par le configurateur est <strong>indicative
        et non contractuelle</strong> : elle résulte d&apos;un calcul
        automatique à partir du volume du fichier, de la matière et de la
        finition, sans examen de la pièce.
      </p>
      <p>
        Après examen, un devis ferme est adressé au client. La vente n&apos;est
        conclue qu&apos;au règlement de ce devis. {entreprise.raisonSociale} se
        réserve le droit de refuser une commande dont la fabrication serait
        techniquement irréalisable, illicite ou contraire aux présentes.
      </p>

      <h2>3. Prix</h2>
      <p>
        Les prix sont indiqués en euros{" "}
        {entreprise.assujettiTva ? "hors taxes, la TVA au taux en vigueur s'ajoutant au montant facturé" : "nets de taxe, la TVA n'étant pas applicable (article 293 B du CGI)"}
        . Les frais de livraison sont indiqués séparément avant le règlement et
        s&apos;ajoutent au prix de la pièce. Le devis ferme est valable trente
        jours.
      </p>

      <h2>4. Paiement</h2>
      <p>
        Le règlement s&apos;effectue en ligne par carte bancaire, au moment de
        l&apos;acceptation du devis, via le prestataire Stripe. Les coordonnées
        bancaires ne transitent pas par les serveurs de{" "}
        {entreprise.raisonSociale}. La production démarre à réception du
        paiement.
      </p>

      <h2>5. Délais et livraison</h2>
      <p>
        Le délai de fabrication indicatif est de{" "}
        {entreprise.delaiFabricationJours} jours ouvrés à compter du règlement,
        auquel s&apos;ajoute le délai d&apos;acheminement propre au mode de
        livraison retenu. Les retards imputables au transporteur ne peuvent
        engager la responsabilité de {entreprise.raisonSociale}.
      </p>
      <p>
        La livraison est assurée en {site.zone}, au choix du client : remise à
        domicile, point relais, ou retrait sur place sur rendez-vous. Il
        appartient au client de vérifier l&apos;état du colis à la réception et
        d&apos;émettre, le cas échéant, les réserves d&apos;usage auprès du
        transporteur.
      </p>

      <h2>6. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L.221-28 3° du code de la consommation,{" "}
        <strong>
          le droit de rétractation ne s&apos;applique pas aux biens confectionnés
          selon les spécifications du consommateur ou nettement personnalisés
        </strong>
        . Les pièces imprimées sur mesure à partir du fichier ou des indications
        du client entrent dans ce cas : la commande n&apos;est pas annulable une
        fois la production lancée.
      </p>
      <p>
        Tant que la production n&apos;a pas démarré, le client peut demander
        l&apos;annulation de sa commande et en obtenir le remboursement
        intégral.
      </p>

      <h2>7. Conformité et garanties</h2>
      <p>
        Les pièces sont couvertes par la garantie légale de conformité
        (art. L.217-3 et suivants du code de la consommation) et par la garantie
        contre les vices cachés (art. 1641 et suivants du code civil). Une pièce
        non conforme au devis, défectueuse ou endommagée au transport est
        remplacée ou remboursée, sur signalement sous quatorze jours
        accompagné de photographies.
      </p>
      <p>
        L&apos;impression 3D par dépôt de filament comporte des caractéristiques
        inhérentes au procédé : strates visibles, légères variations de teinte,
        tolérances dimensionnelles de l&apos;ordre de 0,3 mm, traces de supports
        sur les surfaces en surplomb. Elles ne constituent pas des défauts de
        conformité. {entreprise.raisonSociale} ne garantit pas
        l&apos;aptitude d&apos;une pièce à un usage particulier non précisé à la
        commande, ni la tenue mécanique d&apos;un modèle fourni par le client.
      </p>

      <h2>8. Responsabilité du client sur les fichiers</h2>
      <p>
        Le client garantit détenir les droits nécessaires sur les modèles
        qu&apos;il transmet et assume l&apos;entière responsabilité de leur
        contenu. Est exclue la fabrication de pièces contrefaisantes,
        d&apos;armes ou de leurs composants, et de tout objet dont la
        fabrication est réglementée ou interdite.
      </p>

      <h2>9. Données personnelles</h2>
      <p>
        Le traitement des données est décrit dans la{" "}
        <a href="/confidentialite">politique de confidentialité</a>. Les
        fichiers 3D transmis restent la propriété du client et ne sont utilisés
        que pour l&apos;exécution de sa commande.
      </p>

      <h2>10. Médiation et litiges</h2>
      <p>
        En cas de différend, le client s&apos;adresse d&apos;abord à{" "}
        {entreprise.raisonSociale} à l&apos;adresse{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>. À défaut de solution
        amiable, le consommateur peut recourir gratuitement au médiateur de la
        consommation : {entreprise.mediateur.nom}, {entreprise.mediateur.site}.
      </p>
      <p>
        Le client peut également utiliser la plateforme européenne de règlement
        en ligne des litiges. Les présentes sont soumises au droit français.
      </p>
    </Prose>
  );
}
