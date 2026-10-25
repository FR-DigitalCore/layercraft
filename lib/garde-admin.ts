import "server-only";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Garde d'administration pour les route handlers.
 *
 * Le middleware filtre déjà ces chemins, mais s'y fier seul rend la sécurité
 * tributaire d'une liste de `matcher` : un chemin oublié, un renommage, et la
 * route devient ouverte. Chaque handler revérifie donc le rôle lui-même.
 *
 * Renvoie une réponse d'erreur à retourner tel quel, ou null si l'accès est
 * accordé.
 */
export async function exigerAdmin(): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ erreur: "Non authentifié." }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return NextResponse.json({ erreur: "Accès refusé." }, { status: 403 });
  }
  return null;
}
