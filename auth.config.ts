import { NextResponse } from "next/server";
import type { NextAuthConfig } from "next-auth";

/**
 * Config partagée entre le middleware (runtime edge) et le runtime Node.
 * Elle ne doit contenir aucune dépendance Node — bcrypt et Prisma vivent
 * uniquement dans `auth.ts`.
 */
export const authConfig = {
  // NextAuth v5 rejette toute requête dont l'hôte n'est pas déclaré de
  // confiance (UntrustedHost), et il ne lit pas NEXTAUTH_URL pour cela.
  // En auto-hébergement derrière Nginx, l'en-tête Host est fixé par le
  // reverse proxy (server_name) : on peut s'y fier.
  trustHost: true,
  pages: {
    signIn: "/admin/login",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const connecte = Boolean(auth?.user);
      const chemin = request.nextUrl.pathname;

      if (chemin.startsWith("/admin/login")) {
        return true;
      }
      const zonesProtegees = [
        "/admin",
        "/api/commandes",
        "/api/realisations",
        "/api/tarifs",
        "/api/upload/image",
      ];
      if (zonesProtegees.some((zone) => chemin.startsWith(zone))) {
        // Sur les routes API, renvoyer un 401 JSON plutôt qu'une redirection HTML :
        // le client fetch peut ainsi afficher une erreur exploitable.
        if (!connecte && chemin.startsWith("/api/")) {
          return NextResponse.json({ erreur: "Non authentifié." }, { status: 401 });
        }
        return connecte;
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
