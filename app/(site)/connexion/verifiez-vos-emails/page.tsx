import type { Metadata } from "next";
import { Card } from "@/components/ui/Card";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Vérifiez vos emails",
  robots: { index: false, follow: false },
};

export default function VerifiezVosEmailsPage() {
  return (
    <div className="conteneur max-w-md py-20">
      <Card className="text-center">
        <h1 className="text-2xl font-bold">Consultez votre boîte mail</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Si un compte correspond à cette adresse, un lien de connexion vient d&apos;y
          être envoyé. Il est valable 15 minutes et ne fonctionne qu&apos;une fois.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Rien reçu au bout de quelques minutes ? Pensez aux indésirables.
        </p>
        <ButtonLink href="/" variante="secondaire" className="mt-6">
          Retour à l&apos;accueil
        </ButtonLink>
      </Card>
    </div>
  );
}
