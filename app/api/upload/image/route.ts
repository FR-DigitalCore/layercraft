import { NextResponse } from "next/server";
import { exigerAdmin } from "@/lib/garde-admin";
import { BUCKET_GALERIE, envoyerFichier, urlSignee } from "@/lib/minio";
import { genererCleFichier } from "@/lib/tokens";
import { detecterTypeImage, TAILLE_MAX_IMAGE } from "@/lib/images";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const refus = await exigerAdmin();
  if (refus) return refus;

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
  if (fichier.size > TAILLE_MAX_IMAGE) {
    return NextResponse.json(
      { erreur: "Image trop volumineuse (10 Mo maximum)." },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await fichier.arrayBuffer());
  const type = detecterTypeImage(buffer);
  if (!type) {
    return NextResponse.json(
      { erreur: "Format non supporté : JPEG, PNG ou WebP." },
      { status: 400 },
    );
  }

  const cle = genererCleFichier("galerie", fichier.name);

  try {
    await envoyerFichier(BUCKET_GALERIE, cle, buffer, type);
    return NextResponse.json({
      key: cle,
      url: await urlSignee(BUCKET_GALERIE, cle, 3600),
    });
  } catch (erreur) {
    console.error("[upload:image] échec MinIO", erreur);
    return NextResponse.json(
      { erreur: "Le stockage de l'image a échoué." },
      { status: 502 },
    );
  }
}
