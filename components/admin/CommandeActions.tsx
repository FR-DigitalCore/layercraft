"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Statut } from "@prisma/client";
import { STATUTS, STATUT_INFOS } from "@/lib/statuts";
import { Button } from "@/components/ui/Button";
import { Aide, Erreur, Input, Label, Select, Textarea } from "@/components/ui/Field";

export function CommandeActions({
  id,
  statutInitial,
  prixFinalInitial,
  noteInitiale,
}: {
  id: string;
  statutInitial: Statut;
  prixFinalInitial: number | null;
  noteInitiale: string | null;
}) {
  const router = useRouter();
  const [statut, setStatut] = useState<Statut>(statutInitial);
  const [prixFinal, setPrixFinal] = useState(
    prixFinalInitial !== null ? String(prixFinalInitial) : "",
  );
  const [note, setNote] = useState(noteInitiale ?? "");
  const [etat, setEtat] = useState<"repos" | "envoi" | "ok">("repos");
  const [erreur, setErreur] = useState<string | null>(null);

  const statutChange = statut !== statutInitial;

  async function enregistrer() {
    setErreur(null);
    setEtat("envoi");
    try {
      const reponse = await fetch(`/api/commandes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statut,
          prixFinal: prixFinal.trim() === "" ? null : Number(prixFinal),
          noteAdmin: note.trim() === "" ? null : note,
        }),
      });
      const corps = await reponse.json();
      if (!reponse.ok) throw new Error(corps.erreur ?? "Mise à jour impossible.");
      setEtat("ok");
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Mise à jour impossible.");
      setEtat("repos");
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="statut">Statut</Label>
        <Select
          id="statut"
          value={statut}
          onChange={(e) => {
            setStatut(e.target.value as Statut);
            setEtat("repos");
          }}
        >
          {STATUTS.map((valeur) => (
            <option key={valeur} value={valeur}>
              {STATUT_INFOS[valeur].label}
            </option>
          ))}
        </Select>
        {statutChange && (
          <Aide>
            Le client recevra un email de notification et la note ci-dessous sera
            attachée à cette étape de la timeline.
          </Aide>
        )}
      </div>

      <div>
        <Label htmlFor="prix" optionnel>
          Prix ferme (€ HT)
        </Label>
        <Input
          id="prix"
          type="number"
          min={0}
          step="0.01"
          value={prixFinal}
          onChange={(e) => {
            setPrixFinal(e.target.value);
            setEtat("repos");
          }}
          placeholder="Ex. 42.50"
        />
      </div>

      <div>
        <Label htmlFor="note" optionnel>
          Message au client
        </Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setEtat("repos");
          }}
          placeholder="Visible sur la page de suivi et repris dans l'email."
        />
      </div>

      {erreur && <Erreur>{erreur}</Erreur>}

      <div className="flex items-center gap-3">
        <Button type="button" onClick={enregistrer} disabled={etat === "envoi"}>
          {etat === "envoi" ? "Enregistrement…" : "Enregistrer"}
        </Button>
        {etat === "ok" && (
          <span className="text-sm text-emerald-400" role="status">
            Enregistré
          </span>
        )}
      </div>
    </div>
  );
}
