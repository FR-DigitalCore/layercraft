import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { devisSchema, premiereErreur } from "@/lib/validation";
import { estimerPrix } from "@/lib/prix";
import { chargerGrille } from "@/lib/tarifs";
import { BUCKET_STL, lireFichier } from "@/lib/minio";
import { calculerVolumeCm3 } from "@/lib/stl";
import { genererToken } from "@/lib/tokens";
import { envoyerConfirmationClient, envoyerNotificationAdmin } from "@/lib/emails";
import { ipDepuisRequete, limiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Relit le STL depuis MinIO pour en mesurer le volume. Un échec n'est pas
 * bloquant : le devis part sans volume, la tarification retombe alors sur le
 * volume par défaut de la grille.
 */
async function mesurerVolume(stlKey: string): Promise<number | null> {
  try {
    return calculerVolumeCm3(await lireFichier(BUCKET_STL, stlKey));
  } catch (erreur) {
    console.error("[devis] mesure du volume impossible", erreur);
    return null;
  }
}

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
    // Prix et volume sont toujours recalculés côté serveur : les valeurs
    // affichées au client ne sont jamais reprises telles quelles.
    const grille = await chargerGrille();
    const volumeCm3 = donnees.stlKey ? await mesurerVolume(donnees.stlKey) : null;

    const devis = await prisma.devis.create({
      data: {
        ...donnees,
        token: genererToken(),
        volumeCm3,
        prixEstime: estimerPrix(
          {
            matiere: donnees.matiere,
            qualite: donnees.qualite,
            quantite: donnees.quantite,
            volumeCm3,
          },
          grille,
        ),
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
