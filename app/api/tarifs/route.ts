import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { chargerGrille, enregistrerGrille } from "@/lib/tarifs";
import { grilleTarifaireSchema, premiereErreur } from "@/lib/validation";
import type { GrilleTarifaire } from "@/lib/prix";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ erreur: "Non authentifié." }, { status: 401 });
  }
  return NextResponse.json(await chargerGrille());
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ erreur: "Non authentifié." }, { status: 401 });
  }

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
