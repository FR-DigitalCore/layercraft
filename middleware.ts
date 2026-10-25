import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: [
    "/admin/:path*",
    "/mon-compte/:path*",
    "/api/commandes/:path*",
    "/api/realisations/:path*",
    "/api/tarifs",
    "/api/livraison",
    "/api/mes-devis/:path*",
    "/api/upload/image",
  ],
};
