import NextAuth from "next-auth";
import type { EmailConfig } from "@auth/core/providers/email";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { envoyerLienMagique } from "@/lib/emails";

/** Durée de validité d'un lien magique. Court : il transite par email. */
const DUREE_LIEN_MAGIQUE = 15 * 60; // secondes

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  // L'adaptateur stocke les comptes clients et les jetons des liens magiques.
  // La session reste en JWT : le provider credentials de l'admin l'impose.
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      id: "admin",
      name: "Administration",
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

        return { id: "admin", email: adminEmail, name: "Administrateur", role: "admin" };
      },
    }),
    // Provider email sur mesure plutôt que celui fourni par Nodemailer :
    // l'envoi passe par Resend, le transport SMTP n'aurait jamais servi, et
    // s'en passer retire du projet une dépendance vulnérable et sans
    // correctif disponible.
    {
      id: "lien-magique",
      name: "Lien magique",
      type: "email",
      from: process.env.RESEND_FROM ?? "noreply@localhost",
      maxAge: DUREE_LIEN_MAGIQUE,
      options: {},
      async sendVerificationRequest({ identifier, url }) {
        await envoyerLienMagique(identifier, url, DUREE_LIEN_MAGIQUE / 60);
      },
    } satisfies EmailConfig,
  ],
  events: {
    // Auth.js crée le compte avec email seul ; on récupère le nom déjà connu
    // par une demande de devis pour personnaliser les pages client.
    async createUser({ user }) {
      if (!user.email) return;
      const devis = await prisma.devis.findFirst({
        where: { email: user.email },
        orderBy: { createdAt: "desc" },
        select: { nom: true },
      });
      if (devis?.nom) {
        await prisma.user.update({ where: { id: user.id }, data: { name: devis.nom } });
      }
      // Rattache les demandes déjà envoyées avec cette adresse.
      await prisma.devis.updateMany({
        where: { email: user.email, userId: null },
        data: { userId: user.id },
      });
    },
  },
});
