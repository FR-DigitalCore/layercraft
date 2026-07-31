import { z } from "zod";
import { Statut } from "@prisma/client";
import { MATIERES, QUALITES } from "@/lib/prix";

export const devisSchema = z
  .object({
    nom: z.string().trim().min(2, "Nom trop court").max(120),
    email: z.email("Email invalide").max(180),
    telephone: z
      .string()
      .trim()
      .max(30)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : undefined)),
    message: z
      .string()
      .trim()
      .max(4000)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : undefined)),

    matiere: z.enum(MATIERES),
    couleur: z
      .string()
      .trim()
      .max(60)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v ? v : undefined)),
    qualite: z.enum(QUALITES),
    quantite: z.coerce.number().int().min(1).max(500),

    stlKey: z.string().trim().max(300).optional(),
    stlNom: z.string().trim().max(255).optional(),

    // Anti-spam : champ invisible qui doit rester vide
    website: z.string().max(0).optional(),
  })
  .refine((data) => Boolean(data.stlKey) || Boolean(data.message), {
    message:
      "Joignez un fichier STL ou décrivez votre pièce dans le message.",
    path: ["message"],
  });

export type DevisInput = z.infer<typeof devisSchema>;

export const majCommandeSchema = z
  .object({
    statut: z.enum(Statut).optional(),
    prixFinal: z.coerce.number().min(0).max(1_000_000).nullable().optional(),
    noteAdmin: z.string().trim().max(4000).nullable().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, {
    message: "Aucun champ à mettre à jour",
  });

export const realisationSchema = z.object({
  titre: z.string().trim().min(2).max(140),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  imageKey: z.string().trim().min(1).max(300),
  matiere: z.string().trim().max(40).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  visible: z.boolean().default(true),
  ordre: z.coerce.number().int().min(0).max(9999).default(0),
});

/** Message d'erreur lisible à partir d'un ZodError, préfixé du champ concerné. */
export function premiereErreur(error: z.ZodError): string {
  const probleme = error.issues[0];
  if (!probleme) return "Requête invalide";
  const champ = probleme.path.join(".");
  return champ ? `${champ} : ${probleme.message}` : probleme.message;
}
