import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ModeLivraison } from "@prisma/client";
import { exigerAdmin } from "@/lib/garde-admin";
import { chargerGrillePort, enregistrerGrillePort } from "@/lib/tarifs-livraison";
import { premiereErreur } from "@/lib/validation";
import type { GrillePort } from "@/lib/livraison";

export const runtime = "nodejs";

const grillePortSchema = z.record(
  z.enum(ModeLivraison),
  z
    .array(
      z.object({
        poidsMaxG: z.coerce.number().int().min(1).max(100_000),
        prix: z.coerce.number().min(0).max(10_000),
      }),
    )
    .max(20),
);

export async function GET() {
  const refus = await exigerAdmin();
  if (refus) return refus;
  return NextResponse.json(await chargerGrillePort());
}

export async function PUT(request: Request) {
  const refus = await exigerAdmin();
  if (refus) return refus;

  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: "JSON invalide." }, { status: 400 });
  }

  const resultat = grillePortSchema.safeParse(corps);
  if (!resultat.success) {
    return NextResponse.json({ erreur: premiereErreur(resultat.error) }, { status: 400 });
  }

  // Deux paliers de même poids pour un transporteur violeraient la contrainte
  // d'unicité : on le dit clairement plutôt que de laisser remonter Prisma.
  for (const [mode, paliers] of Object.entries(resultat.data)) {
    const poids = (paliers ?? []).map((p) => p.poidsMaxG);
    if (new Set(poids).size !== poids.length) {
      return NextResponse.json(
        { erreur: `Deux paliers ont le même poids pour ${mode}.` },
        { status: 400 },
      );
    }
  }

  try {
    const grille = resultat.data as GrillePort;
    await enregistrerGrillePort(grille);
    revalidatePath("/devis");
    return NextResponse.json(grille);
  } catch (erreur) {
    console.error("[livraison] enregistrement impossible", erreur);
    return NextResponse.json(
      { erreur: "Enregistrement impossible pour le moment." },
      { status: 500 },
    );
  }
}
