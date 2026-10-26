import { NextResponse } from "next/server";
import { exigerAdmin } from "@/lib/garde-admin";
import { prisma } from "@/lib/prisma";
import { majCommandeSchema, premiereErreur } from "@/lib/validation";
import { envoyerChangementStatut } from "@/lib/emails";
import { creerSessionPaiement, stripeConfigure } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const refus = await exigerAdmin();
  if (refus) return refus;

  const { id } = await params;
  const devis = await prisma.devis.findUnique({
    where: { id },
    include: { evenements: { orderBy: { createdAt: "asc" } } },
  });

  if (!devis) {
    return NextResponse.json({ erreur: "Devis introuvable." }, { status: 404 });
  }
  return NextResponse.json(devis);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const refus = await exigerAdmin();
  if (refus) return refus;

  const { id } = await params;

  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: "JSON invalide." }, { status: 400 });
  }

  const resultat = majCommandeSchema.safeParse(corps);
  if (!resultat.success) {
    return NextResponse.json({ erreur: premiereErreur(resultat.error) }, { status: 400 });
  }

  const existant = await prisma.devis.findUnique({ where: { id } });
  if (!existant) {
    return NextResponse.json({ erreur: "Devis introuvable." }, { status: 404 });
  }

  const { statut, prixFinal, noteAdmin } = resultat.data;
  const statutChange = statut !== undefined && statut !== existant.statut;

  const devis = await prisma.devis.update({
    where: { id },
    data: {
      ...(statut !== undefined ? { statut } : {}),
      ...(prixFinal !== undefined ? { prixFinal } : {}),
      ...(noteAdmin !== undefined ? { noteAdmin } : {}),
      ...(statutChange
        ? { evenements: { create: { statut, commentaire: noteAdmin ?? undefined } } }
        : {}),
    },
  });

  // Passage à « Devis à régler » : c'est le moment où le client doit payer.
  const demandePaiement = statutChange && devis.statut === "ACCEPTE";

  if (demandePaiement && devis.prixFinal === null) {
    return NextResponse.json(
      { erreur: "Renseignez le prix ferme avant de passer le devis à régler." },
      { status: 400 },
    );
  }

  let lienPaiement: string | null = null;
  if (demandePaiement && stripeConfigure()) {
    try {
      lienPaiement = await creerSessionPaiement(devis);
    } catch (erreur) {
      // Le devis reste à régler : le client pourra relancer le paiement
      // depuis sa page de suivi, qui recrée une session à la demande.
      console.error("[commandes] création de la session Stripe impossible", erreur);
    }
  }

  if (statutChange) {
    // L'email ne doit pas faire échouer la mise à jour déjà persistée.
    await envoyerChangementStatut(devis, lienPaiement).catch((erreur) =>
      console.error("[commandes] notification client échouée", erreur),
    );
  }

  return NextResponse.json({ ...devis, lienPaiement });
}
