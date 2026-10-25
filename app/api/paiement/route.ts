import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { creerSessionPaiement, stripeConfigure } from "@/lib/stripe";
import { ipDepuisRequete, limiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Relance du paiement depuis la page de suivi. La session Checkout expire au
 * bout de sept jours : plutôt que de laisser le client devant un lien mort,
 * on en recrée une à la demande.
 *
 * L'accès se fait par le token de suivi, déjà imprévisible et transmis au
 * seul client. Aucun montant n'est accepté du navigateur : tout est relu en
 * base.
 */
export async function POST(request: Request) {
  const { autorise, resteSecondes } = limiter(
    `paiement:${ipDepuisRequete(request)}`,
    20,
    10 * 60_000,
  );
  if (!autorise) {
    return NextResponse.json(
      { erreur: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(resteSecondes) } },
    );
  }

  if (!stripeConfigure()) {
    return NextResponse.json(
      { erreur: "Le paiement en ligne n'est pas disponible. Contactez-nous." },
      { status: 503 },
    );
  }

  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: "JSON invalide." }, { status: 400 });
  }

  const token = (corps as { token?: unknown })?.token;
  if (typeof token !== "string" || token.length < 10 || token.length > 64) {
    return NextResponse.json({ erreur: "Référence invalide." }, { status: 400 });
  }

  const devis = await prisma.devis.findUnique({ where: { token } });
  if (!devis) {
    return NextResponse.json({ erreur: "Devis introuvable." }, { status: 404 });
  }
  if (devis.payeLe) {
    return NextResponse.json({ erreur: "Ce devis est déjà réglé." }, { status: 409 });
  }
  if (devis.statut !== "ACCEPTE" || devis.prixFinal === null) {
    return NextResponse.json(
      { erreur: "Ce devis n'est pas encore prêt à être réglé." },
      { status: 409 },
    );
  }

  try {
    return NextResponse.json({ url: await creerSessionPaiement(devis) });
  } catch (erreur) {
    console.error("[paiement] session Stripe impossible", erreur);
    return NextResponse.json(
      { erreur: "La page de paiement est momentanément indisponible." },
      { status: 502 },
    );
  }
}
