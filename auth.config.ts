import { NextResponse } from "next/server";
import type { NextAuthConfig } from "next-auth";

/** Rôles portés par la session. L'admin est hors base, le client en base. */
export type Role = "admin" | "client";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      email?: string | null;
      name?: string | null;
      role?: Role;
    };
  }
}

/**
 * Config partagée entre le middleware (runtime edge) et le runtime Node.
 * Elle ne doit contenir aucune dépendance Node — bcrypt, Prisma et l'envoi
 * d'emails vivent uniquement dans `auth.ts`.
 */
export const authConfig = {
  // NextAuth v5 rejette toute requête dont l'hôte n'est pas déclaré de
  // confiance (UntrustedHost), et il ne lit pas NEXTAUTH_URL pour cela.
  // En auto-hébergement derrière Nginx, l'en-tête Host est fixé par le
  // reverse proxy (server_name) : on peut s'y fier.
  trustHost: true,
  pages: {
    signIn: "/connexion",
    verifyRequest: "/connexion/verifiez-vos-emails",
    error: "/connexion",
  },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user, trigger }) {
      // `user` n'est présent qu'à la connexion ; ensuite tout vient du jeton.
      if (user) {
        token.role = (user as { role?: Role }).role ?? "client";
        if (user.id) token.id = user.id;
      }
      // Garde-fou : un jeton d'avant l'introduction des rôles ne doit pas
      // être interprété comme administrateur.
      if (trigger === undefined && !token.role) token.role = "client";
      return token;
    },
    session({ session, token }) {
      session.user.role = (token.role as Role | undefined) ?? "client";
      if (typeof token.id === "string") session.user.id = token.id;
      return session;
    },
    authorized({ auth, request }) {
      const chemin = request.nextUrl.pathname;
      const role = auth?.user?.role;
      const connecte = Boolean(auth?.user);

      const zonesAdmin = [
        "/admin",
        "/api/commandes",
        "/api/realisations",
        "/api/tarifs",
        "/api/livraison",
        "/api/upload/image",
      ];
      const zonesClient = ["/mon-compte", "/api/mes-devis"];

      const protegee = (zones: string[]) =>
        zones.some((zone) => chemin === zone || chemin.startsWith(`${zone}/`));

      if (protegee(zonesAdmin)) {
        if (role === "admin") return true;
        // Sur les routes API, renvoyer un statut JSON plutôt qu'une
        // redirection HTML : le client fetch peut ainsi afficher une erreur.
        if (chemin.startsWith("/api/")) {
          return NextResponse.json(
            { erreur: connecte ? "Accès refusé." : "Non authentifié." },
            { status: connecte ? 403 : 401 },
          );
        }
        // Un client connecté n'a rien à faire dans l'admin : on ne le renvoie
        // pas vers une page de connexion qu'il a déjà passée.
        if (connecte) return NextResponse.rewrite(new URL("/404", request.url));
        return false;
      }

      if (protegee(zonesClient)) {
        if (connecte) return true;
        if (chemin.startsWith("/api/")) {
          return NextResponse.json({ erreur: "Non authentifié." }, { status: 401 });
        }
        return false;
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
