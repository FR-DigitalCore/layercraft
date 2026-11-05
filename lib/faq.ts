import { entreprise } from "@/lib/entreprise";
import { TAILLE_MAX_STL } from "@/lib/stl";
import { site } from "@/lib/site";

/**
 * Questions fréquentes affichées sur l'accueil et reprises en Schema.org.
 *
 * Les réponses sont tirées des mêmes constantes que le reste du site : un
 * délai ou une taille maximale modifiés ailleurs ne peuvent pas laisser
 * traîner ici une promesse devenue fausse. Le balisage FAQPage exige que
 * ces réponses soient visibles telles quelles sur la page.
 */
export const FAQ = [
  {
    question: "Faut-il savoir modéliser en 3D pour commander ?",
    reponse:
      "Non. Si vous avez un fichier, déposez-le dans le configurateur et vous obtenez une estimation immédiate. Sinon, décrivez la pièce, son usage et ses dimensions : la modélisation est prise en charge et chiffrée dans le devis.",
  },
  {
    question: "Quels fichiers sont acceptés ?",
    reponse: `Le format STL, jusqu'à ${Math.round(TAILLE_MAX_STL / (1024 * 1024))} Mo. C'est ce qu'exportent tous les logiciels de modélisation et la plupart des bibliothèques de pièces en ligne. Un autre format ou un plan coté se traite au cas par cas, en le décrivant dans la demande.`,
  },
  {
    question: "Combien coûte une pièce imprimée en 3D ?",
    reponse:
      "Le prix dépend du volume de matière, de la matière choisie et de la finition. Le configurateur affiche une estimation dès le dépôt du fichier ; elle est indicative et confirmée par un devis ferme après examen de la pièce, sans engagement de votre part.",
  },
  {
    question: "Quels sont les délais ?",
    reponse: `Une réponse au devis sous 24 à 48 heures ouvrées, puis ${entreprise.delaiFabricationJours} jours ouvrés de fabrication à compter du règlement, auxquels s'ajoute le délai du transporteur.`,
  },
  {
    question: "Quelle matière choisir ?",
    reponse:
      "Le PLA convient aux prototypes et aux objets d'intérieur, le PETG aux pièces fonctionnelles exposées à l'humidité, l'ASA à ce qui reste dehors, le TPU à ce qui doit être souple. En cas de doute, décrivez l'usage de la pièce dans votre demande : le choix est validé avec vous avant lancement.",
  },
  {
    question: "Les prix affichés sont-ils hors taxes ?",
    reponse:
      "Les prix sont nets de taxe : la TVA n'est pas applicable en vertu de l'article 293 B du code général des impôts. Le montant affiché est donc celui que vous réglez, frais de port en sus.",
  },
  {
    question: "Où livrez-vous ?",
    reponse: `Partout en ${site.zone}. Les frais de port sont calculés sur la masse de la commande et affichés avant le paiement. Le retrait sur place est possible.`,
  },
  {
    question: "Que deviennent les fichiers que j'envoie ?",
    reponse:
      "Ils restent votre propriété et ne servent qu'à exécuter votre commande. Ils sont stockés dans un espace non public, accessible uniquement par liens temporaires signés, et ne sont ni revendus ni réutilisés.",
  },
] as const;
