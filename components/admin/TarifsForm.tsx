"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  estimerPrix,
  formatPrix,
  GRILLE_DEFAUT,
  MATIERE_INFOS,
  MATIERES,
  QUALITE_INFOS,
  QUALITES,
  type GrilleTarifaire,
  type Matiere,
  type Qualite,
} from "@/lib/prix";
import { Button } from "@/components/ui/Button";
import { Aide, Erreur, Input, Label } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";

/** Les champs restent en texte pendant la saisie : on ne convertit qu'à l'envoi. */
type Brouillon = {
  matieres: Record<Matiere, string>;
  qualites: Record<Qualite, string>;
  remises: Array<{ seuil: string; pourcentage: string }>;
};

function versBrouillon(grille: GrilleTarifaire): Brouillon {
  return {
    matieres: Object.fromEntries(
      MATIERES.map((m) => [m, String(grille.matieres[m])]),
    ) as Record<Matiere, string>,
    qualites: Object.fromEntries(
      QUALITES.map((q) => [q, String(grille.qualites[q])]),
    ) as Record<Qualite, string>,
    remises: [...grille.remises]
      .sort((a, b) => a.seuil - b.seuil)
      .map((r) => ({
        seuil: String(r.seuil),
        pourcentage: String(Math.round((1 - r.coefficient) * 1000) / 10),
      })),
  };
}

function versGrille(brouillon: Brouillon): GrilleTarifaire {
  const nombre = (valeur: string, repli: number) => {
    const converti = Number(valeur.replace(",", "."));
    return Number.isFinite(converti) ? converti : repli;
  };

  return {
    matieres: Object.fromEntries(
      MATIERES.map((m) => [m, nombre(brouillon.matieres[m], GRILLE_DEFAUT.matieres[m])]),
    ) as Record<Matiere, number>,
    qualites: Object.fromEntries(
      QUALITES.map((q) => [q, nombre(brouillon.qualites[q], GRILLE_DEFAUT.qualites[q])]),
    ) as Record<Qualite, number>,
    remises: brouillon.remises
      .filter((r) => r.seuil.trim() !== "")
      .map((r) => ({
        seuil: Math.round(nombre(r.seuil, 0)),
        coefficient: Math.round((1 - nombre(r.pourcentage, 0) / 100) * 10_000) / 10_000,
      })),
  };
}

export function TarifsForm({ grilleInitiale }: { grilleInitiale: GrilleTarifaire }) {
  const router = useRouter();
  const [brouillon, setBrouillon] = useState<Brouillon>(() =>
    versBrouillon(grilleInitiale),
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [etat, setEtat] = useState<"repos" | "envoi" | "ok">("repos");

  const grille = useMemo(() => versGrille(brouillon), [brouillon]);

  function modifier(maj: (b: Brouillon) => Brouillon) {
    setBrouillon(maj);
    setEtat("repos");
  }

  async function enregistrer() {
    setErreur(null);
    setEtat("envoi");
    try {
      const reponse = await fetch("/api/tarifs", {
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

  function reinitialiser() {
    modifier(() => versBrouillon(GRILLE_DEFAUT));
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-start">
      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold">Prix de base par matière</h2>
          <Aide>
            Prix en euros HT d&apos;une pièce, en qualité standard, avant remise
            quantité.
          </Aide>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {MATIERES.map((matiere) => (
              <div key={matiere}>
                <Label htmlFor={`matiere-${matiere}`}>
                  {MATIERE_INFOS[matiere].titre}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`matiere-${matiere}`}
                    type="number"
                    min={0}
                    step="0.5"
                    value={brouillon.matieres[matiere]}
                    onChange={(e) =>
                      modifier((b) => ({
                        ...b,
                        matieres: { ...b.matieres, [matiere]: e.target.value },
                      }))
                    }
                  />
                  <span className="text-sm text-muted">€ HT</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Coefficient par qualité</h2>
          <Aide>
            Multiplicateur appliqué au prix de base. 1 = tarif de référence, 1,4 = +40 %.
          </Aide>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {QUALITES.map((qualite) => (
              <div key={qualite}>
                <Label htmlFor={`qualite-${qualite}`}>
                  {QUALITE_INFOS[qualite].titre} ({QUALITE_INFOS[qualite].couche})
                </Label>
                <Input
                  id={`qualite-${qualite}`}
                  type="number"
                  min={0.05}
                  step="0.05"
                  value={brouillon.qualites[qualite]}
                  onChange={(e) =>
                    modifier((b) => ({
                      ...b,
                      qualites: { ...b.qualites, [qualite]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold">Remises par quantité</h2>
          <Aide>
            À partir du seuil indiqué, la remise s&apos;applique sur l&apos;ensemble de la
            commande. Si plusieurs paliers sont atteints, le plus avantageux gagne.
          </Aide>

          {brouillon.remises.length === 0 ? (
            <p className="mt-5 text-sm text-muted">Aucune remise quantité.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {brouillon.remises.map((remise, index) => (
                <li key={index} className="flex flex-wrap items-end gap-3">
                  <div className="w-32">
                    <Label htmlFor={`seuil-${index}`}>À partir de</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`seuil-${index}`}
                        type="number"
                        min={2}
                        step="1"
                        value={remise.seuil}
                        onChange={(e) =>
                          modifier((b) => ({
                            ...b,
                            remises: b.remises.map((r, i) =>
                              i === index ? { ...r, seuil: e.target.value } : r,
                            ),
                          }))
                        }
                      />
                      <span className="text-sm text-muted">pcs</span>
                    </div>
                  </div>

                  <div className="w-32">
                    <Label htmlFor={`remise-${index}`}>Remise</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`remise-${index}`}
                        type="number"
                        min={0}
                        max={95}
                        step="1"
                        value={remise.pourcentage}
                        onChange={(e) =>
                          modifier((b) => ({
                            ...b,
                            remises: b.remises.map((r, i) =>
                              i === index ? { ...r, pourcentage: e.target.value } : r,
                            ),
                          }))
                        }
                      />
                      <span className="text-sm text-muted">%</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variante="fantome"
                    taille="sm"
                    onClick={() =>
                      modifier((b) => ({
                        ...b,
                        remises: b.remises.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    Retirer
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <Button
            type="button"
            variante="secondaire"
            taille="sm"
            className="mt-5"
            disabled={brouillon.remises.length >= 10}
            onClick={() =>
              modifier((b) => ({
                ...b,
                remises: [...b.remises, { seuil: "10", pourcentage: "10" }],
              }))
            }
          >
            Ajouter un palier
          </Button>
        </Card>

        {erreur && <Erreur>{erreur}</Erreur>}

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={enregistrer} disabled={etat === "envoi"}>
            {etat === "envoi" ? "Enregistrement…" : "Enregistrer la grille"}
          </Button>
          <Button type="button" variante="fantome" onClick={reinitialiser}>
            Revenir aux valeurs par défaut
          </Button>
          {etat === "ok" && (
            <span className="text-sm text-emerald-400" role="status">
              Grille enregistrée
            </span>
          )}
        </div>
      </div>

      <Card className="lg:sticky lg:top-6">
        <h2 className="text-lg font-semibold">Simulation</h2>
        <Aide>Prix HT pour une pièce, recalculé en direct pendant la saisie.</Aide>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted uppercase">
                <th className="pb-2 font-medium">Matière</th>
                {QUALITES.map((qualite) => (
                  <th key={qualite} className="pb-2 text-right font-medium">
                    {QUALITE_INFOS[qualite].titre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATIERES.map((matiere) => (
                <tr key={matiere} className="border-t border-border">
                  <td className="py-2 font-medium">{matiere}</td>
                  {QUALITES.map((qualite) => (
                    <td key={qualite} className="py-2 text-right tabular-nums">
                      {formatPrix(estimerPrix({ matiere, qualite, quantite: 1 }, grille))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs tracking-wide text-muted uppercase">
            Effet des remises
          </p>
          <p className="mt-2 text-xs text-muted">
            Exemple sur du {MATIERES[1]} en qualité standard :
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {[1, 3, 5, 10].map((quantite) => (
              <li key={quantite} className="flex justify-between gap-4">
                <span className="text-muted">{quantite} pièce{quantite > 1 ? "s" : ""}</span>
                <span className="font-medium tabular-nums">
                  {formatPrix(
                    estimerPrix(
                      { matiere: MATIERES[1], qualite: "standard", quantite },
                      grille,
                    ),
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
