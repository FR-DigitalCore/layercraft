import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/commandes/:path*",
    "/api/realisations/:path*",
    "/api/upload/image",
  ],
};
