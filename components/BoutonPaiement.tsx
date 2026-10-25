"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Erreur } from "@/components/ui/Field";
import { formatPrix } from "@/lib/prix";

export function BoutonPaiement({
  token,
  montant,
}: {
  token: string;
  montant: number;
}) {
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function payer() {
    setErreur(null);
    setEnvoi(true);
    try {
      const reponse = await fetch("/api/paiement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const corps = await reponse.json();
      if (!reponse.ok) throw new Error(corps.erreur ?? "Paiement indisponible.");
      window.location.href = corps.url;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Paiement indisponible.");
      setEnvoi(false);
    }
  }

  return (
    <div>
      <Button type="button" taille="lg" onClick={payer} disabled={envoi}>
        {envoi ? "Ouverture du paiement…" : `Régler ${formatPrix(montant)}`}
      </Button>
      <p className="mt-2 text-xs text-muted">
        Paiement sécurisé par Stripe. Carte bancaire, aucune donnée ne transite par
        nos serveurs.
      </p>
      {erreur && <Erreur>{erreur}</Erreur>}
    </div>
  );
}
