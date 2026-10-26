"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Aide, Input, Label } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export type AdresseChoisie = {
  /** Numéro et voie, tels que normalisés par la BAN. */
  ligne1: string;
  codePostal: string;
  ville: string;
  /** Libellé complet, affiché une fois l'adresse retenue. */
  label: string;
};

type Suggestion = AdresseChoisie & { id: string };

const URL_BAN = "https://api-adresse.data.gouv.fr/search/";
const MIN_CARACTERES = 3;
const DELAI_FRAPPE = 300;

type ReponseBan = {
  features?: Array<{
    properties?: {
      id?: string;
      label?: string;
      name?: string;
      postcode?: string;
      city?: string;
    };
  }>;
};

/**
 * Champ d'adresse unique adossé à la Base Adresse Nationale.
 *
 * La BAN est publique, gratuite et sans clé ; elle est interrogée depuis le
 * navigateur, ce qui évite un aller-retour par notre serveur et laisse le
 * service fonctionner même si le serveur n'a pas d'accès sortant.
 *
 * Elle ne couvre pas tout : constructions récentes, lieux-dits, adresses
 * militaires. La saisie manuelle reste donc toujours accessible, sans quoi
 * ces clients ne pourraient pas commander.
 */
export function AdresseBan({
  adresse,
  onChoisir,
  onEffacer,
  /** Mondial Relay n'a besoin que de la commune pour chercher un point. */
  modeCommune = false,
}: {
  adresse: AdresseChoisie | null;
  onChoisir: (adresse: AdresseChoisie) => void;
  onEffacer: () => void;
  modeCommune?: boolean;
}) {
  const [saisie, setSaisie] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [recherche, setRecherche] = useState(false);
  const [echec, setEchec] = useState(false);
  const [manuel, setManuel] = useState(false);
  const [brouillon, setBrouillon] = useState({ ligne1: "", codePostal: "", ville: "" });

  const idListe = useId();
  const abandon = useRef<AbortController | null>(null);

  useEffect(() => {
    if (adresse || manuel) return;
    const terme = saisie.trim();
    if (terme.length < MIN_CARACTERES) {
      setSuggestions([]);
      return;
    }

    const minuteur = setTimeout(async () => {
      abandon.current?.abort();
      const controleur = new AbortController();
      abandon.current = controleur;

      setRecherche(true);
      setEchec(false);
      try {
        const params = new URLSearchParams({
          q: terme,
          limit: "6",
          type: modeCommune ? "municipality" : "housenumber",
        });
        const reponse = await fetch(`${URL_BAN}?${params}`, {
          signal: controleur.signal,
        });
        if (!reponse.ok) throw new Error(String(reponse.status));

        const corps: ReponseBan = await reponse.json();
        setSuggestions(
          (corps.features ?? [])
            .map((trait, index) => {
              const p = trait.properties ?? {};
              return {
                id: p.id ?? `${index}`,
                ligne1: p.name ?? "",
                codePostal: p.postcode ?? "",
                ville: p.city ?? "",
                label: p.label ?? "",
              };
            })
            .filter((s) => s.codePostal && s.ville),
        );
      } catch (erreur) {
        if ((erreur as Error).name === "AbortError") return;
        // Service indisponible : on ne bloque pas la commande.
        setEchec(true);
        setSuggestions([]);
      } finally {
        setRecherche(false);
      }
    }, DELAI_FRAPPE);

    return () => clearTimeout(minuteur);
  }, [saisie, adresse, manuel, modeCommune]);

  if (adresse) {
    return (
      <div>
        <Label>{modeCommune ? "Commune" : "Adresse de livraison"}</Label>
        <div className="flex items-start justify-between gap-4 rounded-lg border border-accent bg-accent/5 px-4 py-3">
          <p className="text-sm leading-relaxed">{adresse.label}</p>
          <button
            type="button"
            onClick={() => {
              setSaisie("");
              setSuggestions([]);
              setManuel(false);
              onEffacer();
            }}
            className="shrink-0 text-xs text-muted hover:text-text"
          >
            Modifier
          </button>
        </div>
      </div>
    );
  }

  if (manuel) {
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="manuel-ligne1">Numéro et voie</Label>
          <Input
            id="manuel-ligne1"
            value={brouillon.ligne1}
            autoComplete="street-address"
            onChange={(e) => setBrouillon((b) => ({ ...b, ligne1: e.target.value }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <div>
            <Label htmlFor="manuel-cp">Code postal</Label>
            <Input
              id="manuel-cp"
              value={brouillon.codePostal}
              inputMode="numeric"
              maxLength={5}
              autoComplete="postal-code"
              onChange={(e) =>
                setBrouillon((b) => ({
                  ...b,
                  codePostal: e.target.value.replace(/\D/g, ""),
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="manuel-ville">Ville</Label>
            <Input
              id="manuel-ville"
              value={brouillon.ville}
              autoComplete="address-level2"
              onChange={(e) => setBrouillon((b) => ({ ...b, ville: e.target.value }))}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            taille="sm"
            disabled={
              !/^\d{5}$/.test(brouillon.codePostal) ||
              !brouillon.ville.trim() ||
              (!modeCommune && !brouillon.ligne1.trim())
            }
            onClick={() =>
              onChoisir({
                ligne1: brouillon.ligne1.trim(),
                codePostal: brouillon.codePostal,
                ville: brouillon.ville.trim(),
                label: [brouillon.ligne1, brouillon.codePostal, brouillon.ville]
                  .filter(Boolean)
                  .join(" "),
              })
            }
          >
            Valider cette adresse
          </Button>
          <Button
            type="button"
            variante="fantome"
            taille="sm"
            onClick={() => setManuel(false)}
          >
            Revenir à la recherche
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor="adresse-ban">
        {modeCommune ? "Votre commune" : "Adresse de livraison"}
      </Label>
      <Input
        id="adresse-ban"
        value={saisie}
        onChange={(e) => setSaisie(e.target.value)}
        placeholder={modeCommune ? "Lyon, 69003…" : "12 rue de la Paix, Paris"}
        autoComplete="off"
        role="combobox"
        aria-expanded={suggestions.length > 0}
        aria-controls={idListe}
      />
      <Aide>
        {recherche
          ? "Recherche…"
          : modeCommune
            ? "Commencez à taper, les communes vous sont proposées."
            : "Commencez à taper, les adresses officielles vous sont proposées."}
      </Aide>

      {suggestions.length > 0 && (
        <ul
          id={idListe}
          role="listbox"
          className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-border bg-surface"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => {
                  setSuggestions([]);
                  onChoisir(suggestion);
                }}
                className={cn(
                  "w-full border-b border-border px-4 py-2.5 text-left text-sm last:border-b-0",
                  "transition-colors hover:bg-surface-haut",
                )}
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {echec && (
        <Aide>
          La recherche d&apos;adresse est momentanément indisponible.
        </Aide>
      )}

      <button
        type="button"
        onClick={() => setManuel(true)}
        className="mt-2 text-xs text-accent hover:underline"
      >
        {modeCommune
          ? "Saisir ma commune à la main"
          : "Mon adresse n'apparaît pas, la saisir à la main"}
      </button>
    </div>
  );
}
