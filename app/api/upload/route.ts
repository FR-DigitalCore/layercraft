import { NextResponse } from "next/server";
import { BUCKET_STL, envoyerFichier, urlSignee } from "@/lib/minio";
import { genererCleFichier } from "@/lib/tokens";
import {
  mesurerStl,
  estStlValide,
  extensionAutorisee,
  TAILLE_MAX_STL,
} from "@/lib/stl";
import { ipDepuisRequete, limiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { autorise, resteSecondes } = limiter(
    `upload:${ipDepuisRequete(request)}`,
    20,
    10 * 60_000,
  );
  if (!autorise) {
    return NextResponse.json(
      { erreur: "Trop d'envois de fichiers. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(resteSecondes) } },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ erreur: "Requête invalide." }, { status: 400 });
  }

  const fichier = formData.get("file");
  if (!(fichier instanceof File)) {
    return NextResponse.json({ erreur: "Aucun fichier reçu." }, { status: 400 });
  }

  if (!extensionAutorisee(fichier.name)) {
    return NextResponse.json(
      { erreur: "Format non supporté : seuls les fichiers .stl sont acceptés." },
      { status: 400 },
    );
  }

  if (fichier.size > TAILLE_MAX_STL) {
    return NextResponse.json(
      { erreur: "Fichier trop volumineux (50 Mo maximum)." },
      { status: 413 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await fichier.arrayBuffer());
  } catch {
    return NextResponse.json(
      { erreur: "Impossible de lire le fichier. Vérifiez son intégrité." },
      { status: 400 },
    );
  }

  if (!estStlValide(buffer)) {
    return NextResponse.json(
      { erreur: "Ce fichier ne ressemble pas à un STL valide." },
      { status: 400 },
    );
  }

  const cle = genererCleFichier("stl", fichier.name);

  try {
    await envoyerFichier(BUCKET_STL, cle, buffer, "model/stl");
  } catch (erreur) {
    console.error("[upload] écriture dans le stockage impossible", erreur);
    return NextResponse.json(
      { erreur: "Le stockage du fichier a échoué. Réessayez dans un instant." },
      { status: 502 },
    );
  }

  // Étape distincte : le fichier est déjà stocké à ce stade. Les confondre
  // donnait un « stockage échoué » trompeur quand seule la signature cassait.
  try {
    const url = await urlSignee(BUCKET_STL, cle, 3600);
    return NextResponse.json({
      key: cle,
      url,
      nom: fichier.name,
      taille: fichier.size,
      // Sert à l'estimation affichée en direct ; le serveur le recalcule à la
      // création du devis, la valeur renvoyée ici n'est jamais reprise en base.
      ...(mesurerStl(buffer) ?? { volumeCm3: null, aireCm2: null }),
    });
  } catch (erreur) {
    console.error(
      "[upload] fichier stocké mais signature de l'URL impossible — vérifiez MINIO_PUBLIC_ENDPOINT",
      erreur,
    );
    return NextResponse.json(
      { erreur: "Le fichier est enregistré, mais son aperçu est indisponible." },
      { status: 502 },
    );
  }
}
