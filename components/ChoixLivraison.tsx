"use client";

import { useState } from "react";
import type { ModeLivraison } from "@prisma/client";
import {
  formatMasse,
  LIVRAISON_INFOS,
  MODES_LIVRAISON,
  type PalierPort,
} from "@/lib/livraison";
import { formatPrix } from "@/lib/prix";
import { Button } from "@/components/ui/Button";
import { Aide, Erreur, Input, Label } from "@/components/ui/Field";
import { AdresseBan } from "@/components/AdresseBan";
import { cn } from "@/lib/cn";

type PointRelais = {
  id: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
};

export type EtatLivraison = {
  mode: ModeLivraison;
  adresseLigne1: string;
  adresseLigne2: string;
  codePostal: string;
  ville: string;
  /** Libellé complet renvoyé par la BAN, pour réaffichage. */
  adresseLabel: string;
  pointRelaisId: string;
  pointRelaisNom: string;
};

export const LIVRAISON_VIDE: EtatLivraison = {
  mode: "RETRAIT",
  adresseLigne1: "",
  adresseLigne2: "",
  codePostal: "",
  ville: "",
  adresseLabel: "",
  pointRelaisId: "",
  pointRelaisNom: "",
};

export function ChoixLivraison({
  etat,
  onChange,
  masseG,
  fraisParMode,
}: {
  etat: EtatLivraison;
  onChange: (maj: Partial<EtatLivraison>) => void;
  masseG: number;
  fraisParMode: Record<ModeLivraison, number | null>;
}) {
  const [points, setPoints] = useState<PointRelais[] | null>(null);
  const [recherche, setRecherche] = useState(false);
  const [messageRelais, setMessageRelais] = useState<string | null>(null);

  const infos = LIVRAISON_INFOS[etat.mode];

  async function chercherRelais() {
    setMessageRelais(null);
    if (!/^\d{5}$/.test(etat.codePostal)) {
      setMessageRelais("Saisissez un code postal à 5 chiffres.");
      return;
    }
    setRecherche(true);
    try {
      const reponse = await fetch(`/api/points-relais?cp=${etat.codePostal}`);
      const corps = await reponse.json();
      if (!reponse.ok) throw new Error(corps.erreur ?? "Recherche impossible.");
      if (corps.configure === false) {
        setMessageRelais(
          "La recherche automatique n'est pas activée. Indiquez le numéro de votre point relais habituel, nous le confirmerons au devis.",
        );
        setPoints([]);
        return;
      }
      setPoints(corps.points);
      if (corps.points.length === 0) {
        setMessageRelais("Aucun point relais trouvé pour ce code postal.");
      }
    } catch (e) {
      setMessageRelais(e instanceof Error ? e.message : "Recherche impossible.");
    } finally {
      setRecherche(false);
    }
  }

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-1 text-sm font-medium">Mode de réception</legend>
        <Aide>
          Masse estimée du colis : {formatMasse(masseG)}, emballage compris.
        </Aide>
        <div className="mt-3 grid gap-3">
          {MODES_LIVRAISON.map((mode) => {
            const i = LIVRAISON_INFOS[mode];
            const frais = fraisParMode[mode];
            const actif = etat.mode === mode;
            return (
              <label
                key={mode}
                className={cn(
                  "flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4 transition-colors",
                  actif
                    ? "border-accent bg-accent/5"
                    : "border-border bg-surface hover:border-muted/60",
                )}
              >
                <span className="min-w-0">
                  <input
                    type="radio"
                    name="livraison"
                    value={mode}
                    checked={actif}
                    onChange={() => {
                      // Mondial Relay ne demande qu'une commune, Colissimo
                      // une adresse complète : passer de l'un à l'autre rend
                      // la saisie précédente inutilisable, on la réinitialise
                      // plutôt que d'afficher une adresse sans rue.
                      const granulariteChange =
                        LIVRAISON_INFOS[mode].pointRelais !== infos.pointRelais;
                      onChange(
                        granulariteChange
                          ? {
                              mode,
                              adresseLigne1: "",
                              adresseLigne2: "",
                              codePostal: "",
                              ville: "",
                              adresseLabel: "",
                              pointRelaisId: "",
                              pointRelaisNom: "",
                            }
                          : { mode },
                      );
                    }}
                    className="sr-only"
                  />
                  <span className="block font-semibold">{i.titre}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">
                    {i.resume}
                  </span>
                  <span className="mt-1 block text-xs text-muted">{i.delai}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="font-display font-bold">
                    {frais === null ? "Sur devis" : frais === 0 ? "Gratuit" : formatPrix(frais)}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        {fraisParMode[etat.mode] === null && etat.mode !== "RETRAIT" && (
          <Aide>
            La masse dépasse nos paliers de port : nous chiffrerons l&apos;expédition
            à la main et vous la confirmerons avec le devis.
          </Aide>
        )}
      </fieldset>

      {infos.adresse && (
        <div className="space-y-4 rounded-xl border border-border bg-surface p-4">
          <AdresseBan
            modeCommune={infos.pointRelais}
            adresse={
              etat.codePostal && etat.ville
                ? {
                    ligne1: etat.adresseLigne1,
                    codePostal: etat.codePostal,
                    ville: etat.ville,
                    label: etat.adresseLabel,
                  }
                : null
            }
            onChoisir={(a) =>
              onChange({
                adresseLigne1: a.ligne1,
                codePostal: a.codePostal,
                ville: a.ville,
                adresseLabel: a.label,
                // Changer de commune invalide le point relais déjà retenu.
                pointRelaisId: "",
                pointRelaisNom: "",
              })
            }
            onEffacer={() =>
              onChange({
                adresseLigne1: "",
                codePostal: "",
                ville: "",
                adresseLabel: "",
                pointRelaisId: "",
                pointRelaisNom: "",
              })
            }
          />

          {!infos.pointRelais && etat.codePostal && (
            <div>
              <Label htmlFor="adresseLigne2" optionnel>
                Complément — bâtiment, étage, code
              </Label>
              <Input
                id="adresseLigne2"
                value={etat.adresseLigne2}
                autoComplete="address-line2"
                onChange={(e) => onChange({ adresseLigne2: e.target.value })}
              />
            </div>
          )}

          {infos.pointRelais && etat.codePostal ? (
            <div>
              <Button
                type="button"
                variante="secondaire"
                taille="sm"
                onClick={chercherRelais}
                disabled={recherche}
              >
                {recherche ? "Recherche…" : "Chercher un point relais"}
              </Button>

              {messageRelais && <Aide>{messageRelais}</Aide>}

              {points && points.length > 0 && (
                <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                  {points.map((point) => {
                    const actif = etat.pointRelaisId === point.id;
                    return (
                      <li key={point.id}>
                        <button
                          type="button"
                          onClick={() =>
                            onChange({
                              pointRelaisId: point.id,
                              pointRelaisNom: `${point.nom} — ${point.adresse}, ${point.codePostal} ${point.ville}`,
                            })
                          }
                          className={cn(
                            "w-full rounded-lg border p-3 text-left text-sm transition-colors",
                            actif
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-muted/60",
                          )}
                        >
                          <span className="block font-medium">{point.nom}</span>
                          <span className="block text-xs text-muted">
                            {point.adresse}, {point.codePostal} {point.ville}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {points !== null && points.length === 0 && (
                <div className="mt-3">
                  <Label htmlFor="relais-manuel" optionnel>
                    Numéro de point relais
                  </Label>
                  <Input
                    id="relais-manuel"
                    value={etat.pointRelaisId}
                    onChange={(e) =>
                      onChange({
                        pointRelaisId: e.target.value.trim(),
                        pointRelaisNom: "Saisi par le client",
                      })
                    }
                    placeholder="Ex. 062345"
                  />
                </div>
              )}

              {etat.pointRelaisNom && (
                <p className="mt-3 text-sm">
                  Point retenu :{" "}
                  <strong className="font-medium">{etat.pointRelaisNom}</strong>
                </p>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export function ErreurLivraison({ children }: { children: React.ReactNode }) {
  return <Erreur>{children}</Erreur>;
}

export type { PalierPort };
