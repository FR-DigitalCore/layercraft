"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { ModeLivraison } from "@prisma/client";
import {
  calculerFraisPort,
  formatMasse,
  GRILLE_PORT_DEFAUT,
  LIVRAISON_INFOS,
  MODES_LIVRAISON,
  type GrillePort,
} from "@/lib/livraison";
import { formatPrix } from "@/lib/prix";
import { Button } from "@/components/ui/Button";
import { Aide, Erreur, Input, Label } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";

type Brouillon = Record<ModeLivraison, Array<{ poidsMaxG: string; prix: string }>>;

function versBrouillon(grille: GrillePort): Brouillon {
  return Object.fromEntries(
    MODES_LIVRAISON.map((mode) => [
      mode,
      [...grille[mode]]
        .sort((a, b) => a.poidsMaxG - b.poidsMaxG)
        .map((p) => ({ poidsMaxG: String(p.poidsMaxG), prix: String(p.prix) })),
    ]),
  ) as Brouillon;
}

const nombre = (v: string, repli: number) => {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : repli;
};

function versGrille(b: Brouillon): GrillePort {
  return Object.fromEntries(
    MODES_LIVRAISON.map((mode) => [
      mode,
      b[mode]
        .filter((p) => p.poidsMaxG.trim() !== "")
        .map((p) => ({
          poidsMaxG: Math.round(nombre(p.poidsMaxG, 0)),
          prix: nombre(p.prix, 0),
        })),
    ]),
  ) as GrillePort;
}

export function LivraisonForm({ grilleInitiale }: { grilleInitiale: GrillePort }) {
  const router = useRouter();
  const [brouillon, setBrouillon] = useState<Brouillon>(() =>
    versBrouillon(grilleInitiale),
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [etat, setEtat] = useState<"repos" | "envoi" | "ok">("repos");
  const [simMasse, setSimMasse] = useState("450");

  const grille = useMemo(() => versGrille(brouillon), [brouillon]);
  const masse = Math.max(0, nombre(simMasse, 0));

  function modifier(maj: (b: Brouillon) => Brouillon) {
    setBrouillon(maj);
    setEtat("repos");
  }

  async function enregistrer() {
    setErreur(null);
    setEtat("envoi");
    try {
      const reponse = await fetch("/api/livraison", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(grille),
      });
      const corps = await reponse.json();
      if (!reponse.ok) throw new Error(corps.erreur ?? "Enregistrement impossible.");
      setEtat("ok");
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Enregistrement impossible.");
      setEtat("repos");
    }
  }

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_22rem] xl:items-start">
      <div className="space-y-6">
        {MODES_LIVRAISON.map((mode) => (
          <Card key={mode}>
            <h2 className="text-lg font-semibold">{LIVRAISON_INFOS[mode].titre}</h2>
            <Aide>
              Le palier retenu est le premier dont le poids maximum couvre la masse du
              colis. Au-delà du dernier palier, le port est annoncé « sur devis ».
            </Aide>

            <ul className="mt-5 space-y-3">
              {brouillon[mode].map((palier, index) => (
                <li key={index} className="flex flex-wrap items-end gap-3">
                  <div className="w-36">
                    <Label htmlFor={`${mode}-poids-${index}`}>Jusqu&apos;à</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`${mode}-poids-${index}`}
                        type="number"
                        min={1}
                        step="50"
                        value={palier.poidsMaxG}
                        onChange={(e) =>
                          modifier((b) => ({
                            ...b,
                            [mode]: b[mode].map((p, i) =>
                              i === index ? { ...p, poidsMaxG: e.target.value } : p,
                            ),
                          }))
                        }
                      />
                      <span className="text-sm text-muted">g</span>
                    </div>
                  </div>
                  <div className="w-32">
                    <Label htmlFor={`${mode}-prix-${index}`}>Prix</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`${mode}-prix-${index}`}
                        type="number"
                        min={0}
                        step="0.05"
                        value={palier.prix}
                        onChange={(e) =>
                          modifier((b) => ({
                            ...b,
                            [mode]: b[mode].map((p, i) =>
                              i === index ? { ...p, prix: e.target.value } : p,
                            ),
                          }))
                        }
                      />
                      <span className="text-sm text-muted">€</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variante="fantome"
                    taille="sm"
                    onClick={() =>
                      modifier((b) => ({
                        ...b,
                        [mode]: b[mode].filter((_, i) => i !== index),
                      }))
                    }
                  >
                    Retirer
                  </Button>
                </li>
              ))}
            </ul>

            <Button
              type="button"
              variante="secondaire"
              taille="sm"
              className="mt-5"
              disabled={brouillon[mode].length >= 20}
              onClick={() =>
                modifier((b) => ({
                  ...b,
                  [mode]: [...b[mode], { poidsMaxG: "1000", prix: "0" }],
                }))
              }
            >
              Ajouter un palier
            </Button>
          </Card>
        ))}

        {erreur && <Erreur>{erreur}</Erreur>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={enregistrer} disabled={etat === "envoi"}>
            {etat === "envoi" ? "Enregistrement…" : "Enregistrer les tarifs"}
          </Button>
          <Button
            type="button"
            variante="fantome"
            onClick={() => modifier(() => versBrouillon(GRILLE_PORT_DEFAUT))}
          >
            Revenir aux valeurs par défaut
          </Button>
          {etat === "ok" && (
            <span className="text-sm text-emerald-400" role="status">
              Tarifs enregistrés
            </span>
          )}
        </div>
      </div>

      <Card className="xl:sticky xl:top-6">
        <h2 className="text-lg font-semibold">Simulation</h2>
        <Aide>Port appliqué pour une masse de colis donnée, emballage compris.</Aide>

        <div className="mt-5">
          <Label htmlFor="sim-masse">Masse du colis (g)</Label>
          <Input
            id="sim-masse"
            type="number"
            min={0}
            step="50"
            value={simMasse}
            onChange={(e) => setSimMasse(e.target.value)}
          />
          <Aide>Soit {formatMasse(masse)}.</Aide>
        </div>

        <ul className="mt-5 space-y-2.5 text-sm">
          {MODES_LIVRAISON.map((mode) => {
            const prix = calculerFraisPort(mode, masse, grille);
            return (
              <li key={mode} className="flex justify-between gap-4">
                <span className="text-muted">{LIVRAISON_INFOS[mode].titre}</span>
                <span className="font-medium tabular-nums">
                  {prix === null ? "Sur devis" : prix === 0 ? "Gratuit" : formatPrix(prix)}
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
