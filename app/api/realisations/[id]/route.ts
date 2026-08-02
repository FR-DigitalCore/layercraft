import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { premiereErreur, realisationSchema } from "@/lib/validation";
import { BUCKET_GALERIE, supprimerFichier } from "@/lib/minio";

export const runtime = "nodejs";

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

  const resultat = realisationSchema.partial().safeParse(corps);
  if (!resultat.success) {
    return NextResponse.json({ erreur: premiereErreur(resultat.error) }, { status: 400 });
  }

  const { description, matiere, ...reste } = resultat.data;

  try {
    const realisation = await prisma.realisation.update({
      where: { id },
      data: {
        ...reste,
        ...(description !== undefined ? { description: description || null } : {}),
        ...(matiere !== undefined ? { matiere: matiere || null } : {}),
      },
    });
    return NextResponse.json(realisation);
  } catch {
    return NextResponse.json({ erreur: "Réalisation introuvable." }, { status: 404 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ erreur: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;

  const realisation = await prisma.realisation.findUnique({ where: { id } });
  if (!realisation) {
    return NextResponse.json({ erreur: "Réalisation introuvable." }, { status: 404 });
  }

  await prisma.realisation.delete({ where: { id } });

  // L'objet MinIO est orphelin si sa suppression échoue : on log sans bloquer.
  await supprimerFichier(BUCKET_GALERIE, realisation.imageKey).catch((erreur) =>
    console.error("[realisations] suppression image échouée", erreur),
  );

  return NextResponse.json({ ok: true });
}
