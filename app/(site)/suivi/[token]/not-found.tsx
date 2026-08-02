import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { site } from "@/lib/site";

export default function SuiviIntrouvable() {
  return (
    <div className="conteneur max-w-xl py-24">
      <Card className="text-center">
        <h1 className="text-2xl font-bold">Suivi introuvable</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Ce lien de suivi n&apos;existe pas ou n&apos;est plus valide. Vérifiez le lien
          reçu par email, ou contactez-nous à{" "}
          <a href={`mailto:${site.email}`} className="text-accent hover:underline">
            {site.email}
          </a>
          .
        </p>
        <ButtonLink href="/" className="mt-6">
          Retour à l&apos;accueil
        </ButtonLink>
      </Card>
    </div>
  );
}
