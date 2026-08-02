import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { estStatutValide } from "@/lib/statuts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ erreur: "Non authentifié." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const statutBrut = searchParams.get("statut");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 20) || 20));

  if (statutBrut && !estStatutValide(statutBrut)) {
    return NextResponse.json({ erreur: "Statut inconnu." }, { status: 400 });
  }

  const where: Prisma.DevisWhereInput = estStatutValide(statutBrut)
    ? { statut: statutBrut }
    : {};

  const [total, devis] = await Promise.all([
    prisma.devis.count({ where }),
    prisma.devis.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return NextResponse.json({
    devis,
    pagination: { page, limit, total, pages: Math.max(1, Math.ceil(total / limit)) },
  });
}
