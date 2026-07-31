"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  detaillerPrix,
  formatPrix,
  GRILLE_DEFAUT,
  MATIERE_INFOS,
  MATIERES,
  MODE_INFOS,
  MODES,
  QUALITE_INFOS,
  QUALITES,
  type GrilleTarifaire,
  type Matiere,
  type ModeTarification,
  type Qualite,
} from "@/lib/prix";
import { Button } from "@/components/ui/Button";
import { Aide, Erreur, Input, Label, Select } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

/** Les champs restent en texte pendant la saisie : on ne convertit qu'à l'usage. */
type Brouillon = {
  mode: ModeTarification;
  matieres: Record<Matiere, { prixBase: string; prixParGramme: string; densite: string }>;
  qualites: Record<Qualite, { multiplicateur: string; debitCm3ParHeure: string }>;
  remises: Array<{ seuil: string; pourcentage: string }>;
  fraisMiseEnRoute: string;
  prixHoraire: string;
  tauxRemplissage: string;
  volumeParDefaut: string;
};

function versBrouillon(grille: GrilleTarifaire): Brouillon {
  return {
    mode: grille.mode,
    matieres: Object.fromEntries(
      MATIERES.map((m) => [
        m,
        {
          prixBase: String(grille.matieres[m].prixBase),
          prixParGramme: String(grille.matieres[m].prixParGramme),
          densite: String(grille.matieres[m].densite),
        },
      ]),
    ) as Brouillon["matieres"],
    qualites: Object.fromEntries(
      QUALITES.map((q) => [
        q,
        {
          multiplicateur: String(grille.qualites[q].multiplicateur),
          debitCm3ParHeure: String(grille.qualites[q].debitCm3ParHeure),
        },
      ]),
    ) as Brouillon["qualites"],
    remises: [...grille.remises]
      .sort((a, b) => a.seuil - b.seuil)
      .map((r) => ({
        seuil: String(r.seuil),
        pourcentage: String(Math.round((1 - r.coefficient) * 1000) / 10),
      })),
    fraisMiseEnRoute: String(grille.fraisMiseEnRoute),
    prixHoraire: String(grille.prixHoraire),
    tauxRemplissage: String(Math.round(grille.tauxRemplissage * 100)),
    volumeParDefaut: String(grille.volumeParDefaut),
  };
}

const nombre = (valeur: string, repli: number) => {
  const converti = Number(String(valeur).replace(",", "."));
  return Number.isFinite(converti) ? converti : repli;
};

function versGrille(brouillon: Brouillon): GrilleTarifaire {
  return {
    mode: brouillon.mode,
    matieres: Object.fromEntries(
      MATIERES.map((m) => [
        m,
        {
          prixBase: nombre(brouillon.matieres[m].prixBase, GRILLE_DEFAUT.matieres[m].prixBase),
          prixParGramme: nombre(
            brouillon.matieres[m].prixParGramme,
            GRILLE_DEFAUT.matieres[m].prixParGramme,
          ),
          densite: nombre(brouillon.matieres[m].densite, GRILLE_DEFAUT.matieres[m].densite),
        },
      ]),
    ) as GrilleTarifaire["matieres"],
    qualites: Object.fromEntries(
      QUALITES.map((q) => [
        q,
        {
          multiplicateur: nombre(
            brouillon.qualites[q].multiplicateur,
            GRILLE_DEFAUT.qualites[q].multiplicateur,
          ),
          debitCm3ParHeure: nombre(
            brouillon.qualites[q].debitCm3ParHeure,
            GRILLE_DEFAUT.qualites[q].debitCm3ParHeure,
          ),
        },
      ]),
    ) as GrilleTarifaire["qualites"],
    remises: brouillon.remises
      .filter((r) => r.seuil.trim() !== "")
      .map((r) => ({
        seuil: Math.round(nombre(r.seuil, 0)),
        coefficient: Math.round((1 - nombre(r.pourcentage, 0) / 100) * 10_000) / 10_000,
      })),
    fraisMiseEnRoute: nombre(brouillon.fraisMiseEnRoute, GRILLE_DEFAUT.fraisMiseEnRoute),
    prixHoraire: nombre(brouillon.prixHoraire, GRILLE_DEFAUT.prixHoraire),
    tauxRemplissage:
      Math.min(100, Math.max(1, nombre(brouillon.tauxRemplissage, 25))) / 100,
    volumeParDefaut: nombre(brouillon.volumeParDefaut, GRILLE_DEFAUT.volumeParDefaut),
  };
}

export function TarifsForm({ grilleInitiale }: { grilleInitiale: GrilleTarifaire }) {
  const router = useRouter();
  const [brouillon, setBrouillon] = useState<Brouillon>(() => versBrouillon(grilleInitiale));
  const [erreur, setErreur] = useState<string | null>(null);
  const [etat, setEtat] = useState<"repos" | "envoi" | "ok">("repos");

  // Pièce de référence du simulateur
  const [simMatiere, setSimMatiere] = useState<Matiere>("PETG");
  const [simQualite, setSimQualite] = useState<Qualite>("standard");
  const [simQuantite, setSimQuantite] = useState("1");
  const [simVolume, setSimVolume] = useState("30");

  const grille = useMemo(() => versGrille(brouillon), [brouillon]);
  const utiliseVolume = MODE_INFOS[brouillon.mode].besoinVolume;

  const simulation = useMemo(() => {
    const config = {
      matiere: simMatiere,
      qualite: simQualite,
      quantite: Math.max(1, Math.round(nombre(simQuantite, 1))),
      volumeCm3: nombre(simVolume, 0) || null,
    };
    return MODES.map((mode) => ({
      mode,
      detail: detaillerPrix(config, { ...grille, mode }),
    }));
  }, [grille, simMatiere, simQualite, simQuantite, simVolume]);

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

  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_26rem] xl:items-start">
      <div className="space-y-6">
        {/* Mode de tarification */}
        <Card>
          <h2 className="text-lg font-semibold">Modèle de tarification</h2>
          <Aide>
            Change la façon dont le prix est calculé, sur le configurateur public comme
            sur les nouvelles demandes. Les devis déjà enregistrés ne bougent pas.
          </Aide>
          <div className="mt-5 grid gap-3">
            {MODES.map((mode) => {
              const infos = MODE_INFOS[mode];
              const actif = brouillon.mode === mode;
              return (
                <label
                  key={mode}
                  className={cn(
                    "cursor-pointer rounded-xl border p-4 transition-colors",
                    actif
                      ? "border-accent bg-accent/5"
                      : "border-border bg-surface hover:border-muted/60",
                  )}
                >
                  <input
                    type="radio"
                    name="mode"
                    value={mode}
                    checked={actif}
                    onChange={() => modifier((b) => ({ ...b, mode }))}
                    className="sr-only"
                  />
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{infos.titre}</span>
                    {infos.besoinVolume && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[0.7rem] text-muted">
                        utilise le volume du STL
                      </span>
                    )}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-muted">
                    {infos.resume}
                  </span>
                  <code className="mt-2 block text-xs text-accent">{infos.formule}</code>
                </label>
              );
            })}
          </div>
        </Card>

        {/* Prix par matière */}
        <Card>
          <h2 className="text-lg font-semibold">Matières</h2>
          <Aide>
            {utiliseVolume
              ? "Prix du gramme de filament et densité, utilisés pour convertir le volume en coût."
              : "Prix HT d'une pièce en qualité standard, avant remise quantité."}
          </Aide>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wide text-muted uppercase">
                  <th className="pb-2 font-medium">Matière</th>
                  <th
                    className={cn("pb-2 font-medium", utiliseVolume && "text-muted/50")}
                  >
                    Prix forfait (€)
                  </th>
                  <th
                    className={cn("pb-2 font-medium", !utiliseVolume && "text-muted/50")}
                  >
                    Prix / g (€)
                  </th>
                  <th
                    className={cn("pb-2 font-medium", !utiliseVolume && "text-muted/50")}
                  >
                    Densité (g/cm³)
                  </th>
                </tr>
              </thead>
              <tbody>
                {MATIERES.map((matiere) => (
                  <tr key={matiere} className="border-t border-border">
                    <td className="py-2 pr-4 font-medium">
                      {MATIERE_INFOS[matiere].titre}
                    </td>
                    {(
                      [
                        ["prixBase", 0.5, !utiliseVolume],
                        ["prixParGramme", 0.01, utiliseVolume],
                        ["densite", 0.01, utiliseVolume],
                      ] as const
                    ).map(([champ, pas, pertinent]) => (
                      <td key={champ} className="py-2 pr-3">
                        <Input
                          aria-label={`${matiere} — ${champ}`}
                          type="number"
                          min={0}
                          step={pas}
                          value={brouillon.matieres[matiere][champ]}
                          className={cn("w-28", !pertinent && "opacity-50")}
                          onChange={(e) =>
                            modifier((b) => ({
                              ...b,
                              matieres: {
                                ...b.matieres,
                                [matiere]: {
                                  ...b.matieres[matiere],
                                  [champ]: e.target.value,
                                },
                              },
                            }))
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Qualités */}
        <Card>
          <h2 className="text-lg font-semibold">Qualités</h2>
          <Aide>
            Le coefficient multiplie le prix (modes forfait et poids). Le débit sert à
            estimer le temps machine (mode matière + temps).
          </Aide>

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[30rem] text-sm">
              <thead>
                <tr className="text-left text-xs tracking-wide text-muted uppercase">
                  <th className="pb-2 font-medium">Qualité</th>
                  <th
                    className={cn(
                      "pb-2 font-medium",
                      brouillon.mode === "MATIERE_TEMPS" && "text-muted/50",
                    )}
                  >
                    Coefficient
                  </th>
                  <th
                    className={cn(
                      "pb-2 font-medium",
                      brouillon.mode !== "MATIERE_TEMPS" && "text-muted/50",
                    )}
                  >
                    Débit (cm³/h)
                  </th>
                </tr>
              </thead>
              <tbody>
                {QUALITES.map((qualite) => (
                  <tr key={qualite} className="border-t border-border">
                    <td className="py-2 pr-4 font-medium">
                      {QUALITE_INFOS[qualite].titre}{" "}
                      <span className="font-normal text-muted">
                        ({QUALITE_INFOS[qualite].couche})
                      </span>
                    </td>
                    {(
                      [
                        ["multiplicateur", 0.05, brouillon.mode !== "MATIERE_TEMPS"],
                        ["debitCm3ParHeure", 0.5, brouillon.mode === "MATIERE_TEMPS"],
                      ] as const
                    ).map(([champ, pas, pertinent]) => (
                      <td key={champ} className="py-2 pr-3">
                        <Input
                          aria-label={`${qualite} — ${champ}`}
                          type="number"
                          min={0.05}
                          step={pas}
                          value={brouillon.qualites[qualite][champ]}
                          className={cn("w-28", !pertinent && "opacity-50")}
                          onChange={(e) =>
                            modifier((b) => ({
                              ...b,
                              qualites: {
                                ...b.qualites,
                                [qualite]: {
                                  ...b.qualites[qualite],
                                  [champ]: e.target.value,
                                },
                              },
                            }))
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Paramètres des modes au volume */}
        {utiliseVolume && (
          <Card>
            <h2 className="text-lg font-semibold">Paramètres de calcul</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="frais">Mise en route (€ HT)</Label>
                <Input
                  id="frais"
                  type="number"
                  min={0}
                  step="0.5"
                  value={brouillon.fraisMiseEnRoute}
                  onChange={(e) =>
                    modifier((b) => ({ ...b, fraisMiseEnRoute: e.target.value }))
                  }
                />
                <Aide>Ajouté une fois par pièce, avant remise.</Aide>
              </div>

              {brouillon.mode === "MATIERE_TEMPS" && (
                <div>
                  <Label htmlFor="horaire">Prix horaire machine (€ HT)</Label>
                  <Input
                    id="horaire"
                    type="number"
                    min={0}
                    step="0.5"
                    value={brouillon.prixHoraire}
                    onChange={(e) =>
                      modifier((b) => ({ ...b, prixHoraire: e.target.value }))
                    }
                  />
                  <Aide>Amortissement machine, électricité, temps de surveillance.</Aide>
                </div>
              )}

              <div>
                <Label htmlFor="remplissage">Remplissage (%)</Label>
                <Input
                  id="remplissage"
                  type="number"
                  min={1}
                  max={100}
                  step="5"
                  value={brouillon.tauxRemplissage}
                  onChange={(e) =>
                    modifier((b) => ({ ...b, tauxRemplissage: e.target.value }))
                  }
                />
                <Aide>
                  Part du volume réellement déposée. Plancher à 35 % dans le calcul :
                  parois et couches pleines consomment de la matière quel que soit
                  l&apos;infill.
                </Aide>
              </div>

              <div>
                <Label htmlFor="volume-defaut">Volume par défaut (cm³)</Label>
                <Input
                  id="volume-defaut"
                  type="number"
                  min={0.1}
                  step="1"
                  value={brouillon.volumeParDefaut}
                  onChange={(e) =>
                    modifier((b) => ({ ...b, volumeParDefaut: e.target.value }))
                  }
                />
                <Aide>Retenu quand le client décrit sa pièce sans joindre de STL.</Aide>
              </div>
            </div>
          </Card>
        )}

        {/* Remises */}
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
          <Button
            type="button"
            variante="fantome"
            onClick={() => modifier(() => versBrouillon(GRILLE_DEFAUT))}
          >
            Revenir aux valeurs par défaut
          </Button>
          {etat === "ok" && (
            <span className="text-sm text-emerald-400" role="status">
              Grille enregistrée
            </span>
          )}
        </div>
      </div>

      {/* Simulateur */}
      <Card className="xl:sticky xl:top-6">
        <h2 className="text-lg font-semibold">Simulateur</h2>
        <Aide>
          Compare les trois modèles sur une même pièce, avec les valeurs saisies à
          gauche. Rien n&apos;est enregistré tant que vous ne cliquez pas sur
          « Enregistrer ».
        </Aide>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="sim-matiere">Matière</Label>
            <Select
              id="sim-matiere"
              value={simMatiere}
              onChange={(e) => setSimMatiere(e.target.value as Matiere)}
            >
              {MATIERES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sim-qualite">Qualité</Label>
            <Select
              id="sim-qualite"
              value={simQualite}
              onChange={(e) => setSimQualite(e.target.value as Qualite)}
            >
              {QUALITES.map((q) => (
                <option key={q} value={q}>
                  {QUALITE_INFOS[q].titre}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sim-volume">Volume (cm³)</Label>
            <Input
              id="sim-volume"
              type="number"
              min={0}
              step="1"
              value={simVolume}
              onChange={(e) => setSimVolume(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="sim-quantite">Quantité</Label>
            <Input
              id="sim-quantite"
              type="number"
              min={1}
              step="1"
              value={simQuantite}
              onChange={(e) => setSimQuantite(e.target.value)}
            />
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {simulation.map(({ mode, detail }) => {
            const actif = mode === brouillon.mode;
            return (
              <li
                key={mode}
                className={cn(
                  "rounded-lg border p-4",
                  actif ? "border-accent bg-accent/5" : "border-border",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-medium">{MODE_INFOS[mode].titre}</span>
                  <span
                    className={cn(
                      "font-display text-xl font-bold tabular-nums",
                      actif ? "text-accent" : "text-text",
                    )}
                  >
                    {formatPrix(detail.total)}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {formatPrix(detail.parPiece)} / pièce
                  {detail.masseG !== null && ` · ${detail.masseG} g`}
                  {detail.heures !== null && ` · ${detail.heures.toFixed(2)} h`}
                  {detail.remise < 1 &&
                    ` · remise ${Math.round((1 - detail.remise) * 100)} %`}
                </p>
                {actif && (
                  <p className="mt-2 text-[0.7rem] tracking-wide text-accent uppercase">
                    Modèle actif
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs tracking-wide text-muted uppercase">
            Effet des remises — modèle actif
          </p>
          <ul className="mt-3 space-y-1.5 text-sm">
            {[1, 3, 5, 10].map((quantite) => (
              <li key={quantite} className="flex justify-between gap-4">
                <span className="text-muted">
                  {quantite} pièce{quantite > 1 ? "s" : ""}
                </span>
                <span className="font-medium tabular-nums">
                  {formatPrix(
                    detaillerPrix(
                      {
                        matiere: simMatiere,
                        qualite: simQualite,
                        quantite,
                        volumeCm3: nombre(simVolume, 0) || null,
                      },
                      grille,
                    ).total,
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
