import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { envoyerChangementStatut } from "@/lib/emails";

export const runtime = "nodejs";
// Le corps brut est indispensable à la vérification de signature : aucune
// transformation ne doit s'intercaler.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    console.error("[stripe] webhook reçu alors que Stripe n'est pas configuré");
    return NextResponse.json({ erreur: "Stripe non configuré." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ erreur: "Signature absente." }, { status: 400 });
  }

  const corpsBrut = await request.text();

  let evenement: Stripe.Event;
  try {
    // Seule garantie que l'appel vient bien de Stripe : sans elle, n'importe
    // qui pourrait marquer un devis comme payé.
    evenement = stripe.webhooks.constructEvent(corpsBrut, signature, secret);
  } catch (erreur) {
    console.error("[stripe] signature invalide", erreur);
    return NextResponse.json({ erreur: "Signature invalide." }, { status: 400 });
  }

  if (evenement.type !== "checkout.session.completed") {
    // Les autres évènements sont acquittés sans traitement : répondre 200
    // évite que Stripe les rejoue indéfiniment.
    return NextResponse.json({ recu: true });
  }

  const session = evenement.data.object;
  const devisId = session.metadata?.devisId;

  if (!devisId) {
    console.error("[stripe] session sans devisId", session.id);
    return NextResponse.json({ recu: true });
  }
  if (session.payment_status !== "paid") {
    return NextResponse.json({ recu: true });
  }

  try {
    const devis = await prisma.devis.findUnique({ where: { id: devisId } });
    if (!devis) {
      console.error("[stripe] devis introuvable", devisId);
      return NextResponse.json({ recu: true });
    }
    // Stripe rejoue ses évènements : un devis déjà payé ne doit pas créer un
    // second évènement de timeline ni un second email.
    if (devis.payeLe) {
      return NextResponse.json({ recu: true });
    }

    const misAJour = await prisma.devis.update({
      where: { id: devisId },
      data: {
        statut: "PAYE",
        payeLe: new Date(),
        stripeSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        evenements: {
          create: { statut: "PAYE", commentaire: "Règlement reçu en ligne" },
        },
      },
    });

    await envoyerChangementStatut(misAJour).catch((erreur) =>
      console.error("[stripe] email de confirmation échoué", erreur),
    );

    return NextResponse.json({ recu: true });
  } catch (erreur) {
    // Un 500 fait rejouer l'évènement par Stripe, ce qui est le comportement
    // voulu si l'écriture en base a échoué.
    console.error("[stripe] traitement du paiement impossible", erreur);
    return NextResponse.json({ erreur: "Traitement impossible." }, { status: 500 });
  }
}
