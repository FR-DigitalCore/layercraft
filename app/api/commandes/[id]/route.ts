import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { majCommandeSchema, premiereErreur } from "@/lib/validation";
import { envoyerChangementStatut } from "@/lib/emails";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ erreur: "Non authentifié." }, { status: 401 });
  }

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
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ erreur: "Non authentifié." }, { status: 401 });
  }

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

  if (statutChange) {
    // L'email ne doit pas faire échouer la mise à jour déjà persistée.
    await envoyerChangementStatut(devis).catch((erreur) =>
      console.error("[commandes] notification client échouée", erreur),
    );
  }

  return NextResponse.json(devis);
}
