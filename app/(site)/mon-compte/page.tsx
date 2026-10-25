import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/prix";
import { formatDateCourte, STATUT_INFOS } from "@/lib/statuts";
import { Badge, Card, TitreSection } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Mes demandes",
  robots: { index: false, follow: false },
};

export default async function MonComptePage() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "client") {
    redirect("/connexion?suite=/mon-compte");
  }

  // Filtré sur l'identifiant de session, jamais sur un paramètre d'URL :
  // un client ne peut pas demander les devis d'un autre.
  const devis = await prisma.devis.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="conteneur max-w-4xl py-16">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <TitreSection
          titre="Mes demandes"
          chapeau={`Connecté en tant que ${session.user.email}.`}
        />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button type="submit" variante="fantome" taille="sm">
            Déconnexion
          </Button>
        </form>
      </div>

      {devis.length === 0 ? (
        <Card className="mt-10 text-center">
          <p className="text-sm text-muted">
            Aucune demande pour le moment avec cette adresse.
          </p>
          <ButtonLink href="/devis" className="mt-6">
            Demander un devis
          </ButtonLink>
        </Card>
      ) : (
        <ul className="mt-10 space-y-4">
          {devis.map((d) => {
            const infos = STATUT_INFOS[d.statut];
            const aRegler = d.statut === "ACCEPTE" && d.prixFinal !== null;
            return (
              <li key={d.id}>
                <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={infos.couleur}>{infos.label}</Badge>
                      <span className="text-xs text-muted">
                        du {formatDateCourte(d.createdAt)}
                      </span>
                    </div>
                    <p className="mt-2 font-medium">
                      {d.matiere} · {d.qualite} · ×{d.quantite}
                      {d.stlNom && (
                        <span className="ml-2 text-sm font-normal text-muted">
                          {d.stlNom}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {d.prixFinal !== null
                        ? `Devis ferme : ${formatPrix(d.prixFinal)}`
                        : `Estimation : ${formatPrix(d.prixEstime)}`}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    {aRegler && (
                      <ButtonLink href={`/suivi/${d.token}`} taille="sm">
                        Régler ce devis
                      </ButtonLink>
                    )}
                    <Link
                      href={`/suivi/${d.token}`}
                      className="inline-flex items-center text-sm font-medium text-accent hover:underline"
                    >
                      Voir le suivi →
                    </Link>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
