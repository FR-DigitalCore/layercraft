import "server-only";
import Stripe from "stripe";
import type { Devis } from "@prisma/client";
import { site } from "@/lib/site";
import { LIVRAISON_INFOS } from "@/lib/livraison";
import { MATIERE_INFOS, QUALITE_INFOS, type Matiere, type Qualite } from "@/lib/prix";

const cle = process.env.STRIPE_SECRET_KEY;

/**
 * Stripe reste facultatif : sans clé, l'atelier continue de chiffrer ses
 * devis et d'encaisser hors ligne. Les routes de paiement répondent alors
 * explicitement que le règlement en ligne n'est pas configuré.
 */
export const stripe = cle ? new Stripe(cle) : null;

export function stripeConfigure(): boolean {
  return Boolean(cle);
}

/** Stripe raisonne en centimes entiers. */
function centimes(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Session de paiement pour un devis chiffré. Le montant vient toujours de la
 * base : ni le prix ni le port ne transitent par le navigateur.
 */
export async function creerSessionPaiement(devis: Devis): Promise<string> {
  if (!stripe) throw new Error("Stripe n'est pas configuré");
  if (devis.prixFinal === null) throw new Error("Le devis n'a pas de prix ferme");

  const matiere = MATIERE_INFOS[devis.matiere as Matiere];
  const qualite = QUALITE_INFOS[devis.qualite as Qualite];

  const lignes: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: centimes(devis.prixFinal),
        product_data: {
          name: `Impression 3D — ${matiere?.titre ?? devis.matiere} ×${devis.quantite}`,
          description: [
            qualite ? `Qualité ${qualite.titre} (${qualite.couche})` : devis.qualite,
            devis.couleur ? `Couleur ${devis.couleur}` : null,
            devis.stlNom,
          ]
            .filter(Boolean)
            .join(" · "),
        },
      },
    },
  ];

  if (devis.fraisPort && devis.fraisPort > 0) {
    lignes.push({
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: centimes(devis.fraisPort),
        product_data: {
          name: `Livraison — ${LIVRAISON_INFOS[devis.modeLivraison].titre}`,
        },
      },
    });
  }

  const session = await stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: lignes,
      customer_email: devis.email,
      locale: "fr",
      // Le token de suivi sert d'identifiant de retour : il est déjà
      // imprévisible et ne révèle pas l'identifiant interne du devis.
      success_url: `${site.url}/suivi/${devis.token}?paiement=ok`,
      cancel_url: `${site.url}/suivi/${devis.token}?paiement=annule`,
      metadata: { devisId: devis.id, token: devis.token },
      payment_intent_data: {
        metadata: { devisId: devis.id },
        description: `Devis ${devis.token} — ${site.nom}`,
      },
      expires_at: Math.floor(Date.now() / 1000) + 7 * 24 * 3600,
    },
    // Rejouer l'acceptation d'un même devis ne crée pas deux sessions.
    { idempotencyKey: `devis-${devis.id}-${centimes(devis.prixFinal)}` },
  );

  if (!session.url) throw new Error("Stripe n'a pas renvoyé d'URL de paiement");
  return session.url;
}

export async function recupererSession(
  sessionId: string,
): Promise<Stripe.Checkout.Session | null> {
  if (!stripe) return null;
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (erreur) {
    console.error("[stripe] session introuvable", erreur);
    return null;
  }
}
