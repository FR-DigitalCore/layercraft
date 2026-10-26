import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { exigerAdmin } from "@/lib/garde-admin";
import { chargerGrille, enregistrerGrille } from "@/lib/tarifs";
import { grilleTarifaireSchema, premiereErreur } from "@/lib/validation";
import type { GrilleTarifaire } from "@/lib/prix";

export const runtime = "nodejs";

export async function GET() {
  const refus = await exigerAdmin();
  if (refus) return refus;
  return NextResponse.json(await chargerGrille());
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

  const resultat = grilleTarifaireSchema.safeParse(corps);
  if (!resultat.success) {
    return NextResponse.json({ erreur: premiereErreur(resultat.error) }, { status: 400 });
  }

  try {
    const grille = resultat.data as GrilleTarifaire;
    await enregistrerGrille(grille);
    // Le configurateur est rendu côté serveur : il doit repartir sur la nouvelle grille.
    revalidatePath("/devis");
    return NextResponse.json(grille);
  } catch (erreur) {
    console.error("[tarifs] enregistrement impossible", erreur);
    return NextResponse.json(
      { erreur: "Enregistrement impossible pour le moment." },
      { status: 500 },
    );
  }
}
