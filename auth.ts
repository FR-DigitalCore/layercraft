import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const hash = process.env.ADMIN_PASSWORD_HASH;

        if (!adminEmail || !hash) {
          console.error("[auth] ADMIN_EMAIL ou ADMIN_PASSWORD_HASH manquant");
          return null;
        }
        if (!email || !password) return null;

        // Compare toujours le hash, même si l'email ne correspond pas :
        // le temps de réponse ne révèle pas l'existence du compte.
        const motDePasseOk = await bcrypt.compare(password, hash);
        if (email !== adminEmail || !motDePasseOk) return null;

        return { id: "admin", email: adminEmail, name: "Administrateur" };
      },
    }),
  ],
});
