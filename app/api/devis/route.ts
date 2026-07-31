import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { devisSchema, premiereErreur } from "@/lib/validation";
import { estimerPrix } from "@/lib/prix";
import { genererToken } from "@/lib/tokens";
import { envoyerConfirmationClient, envoyerNotificationAdmin } from "@/lib/emails";
import { ipDepuisRequete, limiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { autorise, resteSecondes } = limiter(
    `devis:${ipDepuisRequete(request)}`,
    5,
    10 * 60_000,
  );
  if (!autorise) {
    return NextResponse.json(
      { erreur: "Trop de demandes envoyées. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(resteSecondes) } },
    );
  }

  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return NextResponse.json({ erreur: "JSON invalide." }, { status: 400 });
  }

  const resultat = devisSchema.safeParse(corps);
  if (!resultat.success) {
    return NextResponse.json(
      { erreur: premiereErreur(resultat.error) },
      { status: 400 },
    );
  }

  const { website, ...donnees } = resultat.data;

  // Honeypot rempli : on répond 200 sans rien enregistrer, le bot ne réessaiera pas.
  if (website) {
    return NextResponse.json({ token: genererToken() });
  }

  try {
    const devis = await prisma.devis.create({
      data: {
        ...donnees,
        token: genererToken(),
        prixEstime: estimerPrix({
          matiere: donnees.matiere,
          qualite: donnees.qualite,
          quantite: donnees.quantite,
        }),
        evenements: {
          create: { statut: "RECU", commentaire: "Demande reçue via le site" },
        },
      },
    });

    // Les emails ne doivent pas bloquer la réponse plus que nécessaire,
    // mais on les attend pour pouvoir logger un échec côté serveur.
    await Promise.allSettled([
      envoyerConfirmationClient(devis),
      envoyerNotificationAdmin(devis),
    ]);

    return NextResponse.json({ token: devis.token }, { status: 201 });
  } catch (erreur) {
    console.error("[devis] création impossible", erreur);
    return NextResponse.json(
      { erreur: "Enregistrement impossible pour le moment. Réessayez plus tard." },
      { status: 500 },
    );
  }
}
