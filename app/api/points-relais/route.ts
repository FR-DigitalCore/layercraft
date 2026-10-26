import { NextResponse } from "next/server";
import { chercherPointsRelais, mondialRelayConfigure } from "@/lib/transporteurs/mondial-relay";
import { ipDepuisRequete, limiter } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { autorise, resteSecondes } = limiter(
    `relais:${ipDepuisRequete(request)}`,
    60,
    10 * 60_000,
  );
  if (!autorise) {
    return NextResponse.json(
      { erreur: "Trop de recherches. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(resteSecondes) } },
    );
  }

  const codePostal = new URL(request.url).searchParams.get("cp")?.trim() ?? "";
  if (!/^\d{5}$/.test(codePostal)) {
    return NextResponse.json(
      { erreur: "Code postal invalide." },
      { status: 400 },
    );
  }

  if (!mondialRelayConfigure()) {
    return NextResponse.json({ configure: false, points: [] });
  }

  const points = await chercherPointsRelais(codePostal);
  if (points === null) {
    return NextResponse.json(
      { erreur: "La recherche de points relais est momentanément indisponible." },
      { status: 503 },
    );
  }

  return NextResponse.json({ configure: true, points });
}
