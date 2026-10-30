import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { ModeLivraison } from "@prisma/client";
import { exigerAdmin } from "@/lib/garde-admin";
import {
  chargerConfigLivraison,
  enregistrerConfigLivraison,
  type ConfigLivraison,
} from "@/lib/tarifs-livraison";
import { premiereErreur } from "@/lib/validation";
import { MODES_LIVRAISON } from "@/lib/livraison";

export const runtime = "nodejs";

const palierSchema = z.object({
  poidsMaxG: z.coerce.number().int().min(1).max(100_000),
  prix: z.coerce.number().min(0).max(10_000),
});

const configLivraisonSchema = z.object({
  grille: z.record(z.enum(ModeLivraison), z.array(palierSchema).max(20)),
  actifs: z.record(z.enum(ModeLivraison), z.boolean()),
});

export async function GET() {
  const refus = await exigerAdmin();
  if (refus) return refus;
  return NextResponse.json(await chargerConfigLivraison());
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

  const resultat = configLivraisonSchema.safeParse(corps);
  if (!resultat.success) {
    return NextResponse.json({ erreur: premiereErreur(resultat.error) }, { status: 400 });
  }

  // Deux paliers de même poids pour un transporteur violeraient la contrainte
  // d'unicité : on le dit clairement plutôt que de laisser remonter Prisma.
  for (const [mode, paliers] of Object.entries(resultat.data.grille)) {
    const poids = (paliers ?? []).map((p) => p.poidsMaxG);
    if (new Set(poids).size !== poids.length) {
      return NextResponse.json(
        { erreur: `Deux paliers ont le même poids pour ${mode}.` },
        { status: 400 },
      );
    }
  }

  // Tout désactiver rendrait la commande impossible : on refuse plutôt que
  // de laisser le site dans un état où personne ne peut être livré.
  if (!MODES_LIVRAISON.some((mode) => resultat.data.actifs[mode])) {
    return NextResponse.json(
      { erreur: "Gardez au moins un mode de livraison actif." },
      { status: 400 },
    );
  }

  try {
    const config = resultat.data as ConfigLivraison;
    await enregistrerConfigLivraison(config);
    revalidatePath("/devis");
    return NextResponse.json(config);
  } catch (erreur) {
    console.error("[livraison] enregistrement impossible", erreur);
    return NextResponse.json(
      { erreur: "Enregistrement impossible pour le moment." },
      { status: 500 },
    );
  }
}
