import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ConnexionForm } from "@/components/ConnexionForm";
import { TitreSection } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Accédez à vos demandes de devis et suivez vos commandes.",
  robots: { index: false, follow: false },
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const session = await auth();
  if (session?.user?.role === "client") redirect("/mon-compte");

  const { suite } = await searchParams;
  // Une destination fournie dans l'URL ne doit pas pouvoir renvoyer ailleurs
  // que sur ce site : on n'accepte qu'un chemin relatif simple.
  const redirection = suite && /^\/[^/\\]/.test(suite) ? suite : undefined;

  return (
    <div className="conteneur max-w-md py-20">
      <TitreSection
        titre="Votre espace"
        chapeau="Retrouvez vos demandes, vos devis et l'avancement de vos impressions."
      />
      <div className="mt-8">
        <ConnexionForm redirection={redirection} />
      </div>
    </div>
  );
}
