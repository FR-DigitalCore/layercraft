import { NextResponse } from "next/server";
import { exigerAdmin } from "@/lib/garde-admin";
import { prisma } from "@/lib/prisma";
import { premiereErreur, realisationSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const refus = await exigerAdmin();
  if (refus) return refus;

  const realisations = await prisma.realisation.findMany({
    orderBy: [{ ordre: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(realisations);
}

export async function POST(request: Request) {
  const refus = await exigerAdmin();
  if (refus) return refus;

  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: "JSON invalide." }, { status: 400 });
  }

  const resultat = realisationSchema.safeParse(corps);
  if (!resultat.success) {
    return NextResponse.json({ erreur: premiereErreur(resultat.error) }, { status: 400 });
  }

  const { description, matiere, ...reste } = resultat.data;

  const realisation = await prisma.realisation.create({
    data: {
      ...reste,
      description: description || null,
      matiere: matiere || null,
    },
  });

  return NextResponse.json(realisation, { status: 201 });
}
