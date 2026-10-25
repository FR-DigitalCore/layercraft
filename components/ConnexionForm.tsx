"use client";

import { signIn } from "next-auth/react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Aide, Erreur, Input, Label } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";

export function ConnexionForm({ redirection }: { redirection?: string }) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setEnvoi(true);

    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();

    const resultat = await signIn("lien-magique", {
      email,
      redirect: false,
      callbackUrl: redirection ?? "/mon-compte",
    });

    if (resultat?.error) {
      setErreur("L'envoi a échoué. Vérifiez votre adresse et réessayez.");
      setEnvoi(false);
      return;
    }

    // Succès : on reste sur place et on affiche la consigne, plutôt que de
    // rediriger vers une page qui révélerait si l'adresse est connue.
    window.location.href = "/connexion/verifiez-vos-emails";
  }

  return (
    <Card>
      <form onSubmit={soumettre} className="space-y-4">
        <div>
          <Label htmlFor="email">Votre adresse email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.fr"
            required
          />
          <Aide>
            Nous vous envoyons un lien de connexion. Pas de mot de passe à retenir.
          </Aide>
        </div>
        {erreur && <Erreur>{erreur}</Erreur>}
        <Button type="submit" className="w-full" disabled={envoi}>
          {envoi ? "Envoi en cours…" : "Recevoir mon lien"}
        </Button>
      </form>
    </Card>
  );
}
