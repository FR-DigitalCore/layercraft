"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Erreur, Input, Label } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";

export function LoginForm() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  async function soumettre(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErreur(null);
    setEnvoi(true);

    const donnees = new FormData(event.currentTarget);
    const resultat = await signIn("admin", {
      email: String(donnees.get("email") ?? ""),
      password: String(donnees.get("password") ?? ""),
      redirect: false,
    });

    if (resultat?.error) {
      setErreur("Identifiants incorrects.");
      setEnvoi(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <Card>
      <form onSubmit={soumettre} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="username" required />
        </div>
        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </div>
        {erreur && <Erreur>{erreur}</Erreur>}
        <Button type="submit" className="w-full" disabled={envoi}>
          {envoi ? "Connexion…" : "Se connecter"}
        </Button>
      </form>
    </Card>
  );
}
