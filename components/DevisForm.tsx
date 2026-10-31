"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState, type DragEvent } from "react";
import {
  detaillerPrix,
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
import { formatTaille, TAILLE_MAX_STL } from "@/lib/stl";
import type { ModeLivraison } from "@prisma/client";
import {
  calculerFraisPort,
  estimerMasseG,
  GRILLE_PORT_DEFAUT,
  MODES_LIVRAISON,
  type GrillePort,
} from "@/lib/livraison";
import { LIVRAISON_INFOS } from "@/lib/livraison";
import {
  ChoixLivraison,
  LIVRAISON_VIDE,
  type EtatLivraison,
} from "@/components/ChoixLivraison";
import { Button } from "@/components/ui/Button";
import { Aide, Erreur, Input, Label, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

// Three.js touche à `window` : jamais de rendu serveur pour l'aperçu.
const StlViewer = dynamic(() => import("@/components/StlViewer"), {
  ssr: false,
  loading: () => (
    <div className="h-72 animate-pulse rounded-xl border border-border bg-surface-haut" />
  ),
});

type Fichier = {
  key: string;
  url: string;
  nom: string;
  taille: number;
  volumeCm3: number | null;
  aireCm2: number | null;
};

const ETAPES = ["Votre fichier", "Configuration", "Contact"] as const;

export function DevisForm({
  grille = GRILLE_DEFAUT,
  grillePort = GRILLE_PORT_DEFAUT,
  modesLivraison = MODES_LIVRAISON,
}: {
  /** Grille tarifaire courante, chargée côté serveur depuis /admin/tarifs. */
  grille?: GrilleTarifaire;
  /** Grille de port courante, chargée depuis /admin/livraison. */
  grillePort?: GrillePort;
  /** Transporteurs activés en admin. */
  modesLivraison?: ModeLivraison[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const matiereInitiale = params.get("matiere");

  const [etape, setEtape] = useState(0);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // Étape 1
  const [fichier, setFichier] = useState<Fichier | null>(null);
  const [televersement, setTeleversement] = useState(false);
  const [survol, setSurvol] = useState(false);
  const inputFichier = useRef<HTMLInputElement>(null);

  // Étape 2
  const [matiere, setMatiere] = useState<Matiere>(
    MATIERES.includes(matiereInitiale as Matiere) ? (matiereInitiale as Matiere) : "PLA",
  );
  const [qualite, setQualite] = useState<Qualite>("standard");
  const [couleur, setCouleur] = useState("");
  const [quantite, setQuantite] = useState(1);

  // Étape 3
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [livraison, setLivraison] = useState<EtatLivraison>(() => ({
    ...LIVRAISON_VIDE,
    // Le mode par défaut doit faire partie des modes proposés.
    mode: modesLivraison[0] ?? "RETRAIT",
  }));

  const masseG = useMemo(
    () =>
      estimerMasseG(
        { matiere, quantite, volumeCm3: fichier?.volumeCm3, aireCm2: fichier?.aireCm2 },
        grille,
      ),
    [matiere, quantite, fichier?.volumeCm3, fichier?.aireCm2, grille],
  );

  const fraisParMode = useMemo(
    () =>
      Object.fromEntries(
        MODES_LIVRAISON.map((mode) => [
          mode,
          calculerFraisPort(mode, masseG, grillePort),
        ]),
      ) as Record<ModeLivraison, number | null>,
    [masseG, grillePort],
  );

  const fraisPort = fraisParMode[livraison.mode];

  const detail = useMemo(
    () =>
      detaillerPrix(
        {
          matiere,
          qualite,
          quantite,
          volumeCm3: fichier?.volumeCm3,
          aireCm2: fichier?.aireCm2,
        },
        grille,
      ),
    [matiere, qualite, quantite, fichier?.volumeCm3, fichier?.aireCm2, grille],
  );

  async function televerser(f: File) {
    setErreur(null);

    if (!f.name.toLowerCase().endsWith(".stl")) {
      setErreur("Seuls les fichiers .stl sont acceptés.");
      return;
    }
    if (f.size > TAILLE_MAX_STL) {
      setErreur("Fichier trop volumineux (50 Mo maximum).");
      return;
    }

    setTeleversement(true);
    try {
      const donnees = new FormData();
      donnees.append("file", f);
      const reponse = await fetch("/api/upload", { method: "POST", body: donnees });
      const corps = await reponse.json();
      if (!reponse.ok) throw new Error(corps.erreur ?? "Envoi impossible.");
      setFichier({
        key: corps.key,
        url: corps.url,
        nom: corps.nom,
        taille: corps.taille,
        volumeCm3: corps.volumeCm3 ?? null,
        aireCm2: corps.aireCm2 ?? null,
      });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setTeleversement(false);
    }
  }

  function deposer(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setSurvol(false);
    const f = event.dataTransfer.files?.[0];
    if (f) void televerser(f);
  }

  function suivant() {
    setErreur(null);
    if (etape === 0 && !fichier && message.trim().length < 10) {
      setErreur(
        "Déposez un fichier STL ou décrivez votre pièce en quelques mots (10 caractères minimum).",
      );
      return;
    }
    setEtape((e) => Math.min(e + 1, ETAPES.length - 1));
  }

  async function envoyer() {
    setErreur(null);

    if (nom.trim().length < 2) return setErreur("Indiquez votre nom.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setErreur("Email invalide.");

    setEnvoi(true);
    try {
      const reponse = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom,
          email,
          telephone,
          message,
          matiere,
          couleur,
          qualite,
          quantite,
          stlKey: fichier?.key,
          stlNom: fichier?.nom,
          modeLivraison: livraison.mode,
          adresseLigne1: livraison.adresseLigne1,
          adresseLigne2: livraison.adresseLigne2,
          codePostal: livraison.codePostal,
          ville: livraison.ville,
          pointRelaisId: livraison.pointRelaisId,
          pointRelaisNom: livraison.pointRelaisNom,
          website,
        }),
      });
      const corps = await reponse.json();
      if (!reponse.ok) throw new Error(corps.erreur ?? "Envoi impossible.");
      router.push(`/suivi/${corps.token}`);
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Envoi impossible.");
      setEnvoi(false);
    }
  }

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
      <div>
        {/* Fil d'étapes */}
        <ol className="mb-8 flex gap-2">
          {ETAPES.map((titre, index) => (
            <li key={titre} className="flex-1">
              <button
                type="button"
                onClick={() => index < etape && setEtape(index)}
                disabled={index > etape}
                className={cn(
                  "w-full border-t-2 pt-3 text-left text-xs font-medium transition-colors",
                  index === etape
                    ? "border-accent text-text"
                    : index < etape
                      ? "border-accent/40 text-muted hover:text-text"
                      : "border-border text-muted/60",
                )}
              >
                <span className="block text-[0.7rem] tracking-wide uppercase">
                  Étape {index + 1}
                </span>
                {titre}
              </button>
            </li>
          ))}
        </ol>

        {etape === 0 && (
          <section className="space-y-5">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setSurvol(true);
              }}
              onDragLeave={() => setSurvol(false)}
              onDrop={deposer}
              className={cn(
                "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
                survol ? "border-accent bg-accent/5" : "border-border bg-surface",
              )}
            >
              <p className="text-sm font-medium">
                Glissez votre fichier STL ici
              </p>
              <p className="mt-1 text-xs text-muted">
                ou cliquez pour parcourir — 50 Mo maximum
              </p>
              <Button
                type="button"
                variante="secondaire"
                taille="sm"
                className="mt-4"
                disabled={televersement}
                onClick={() => inputFichier.current?.click()}
              >
                {televersement ? "Envoi en cours…" : "Choisir un fichier"}
              </Button>
              <input
                ref={inputFichier}
                type="file"
                accept=".stl"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void televerser(f);
                  e.target.value = "";
                }}
              />
            </div>

            {fichier && (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-sm">
                  <span className="truncate">
                    <strong className="font-medium">{fichier.nom}</strong>
                    <span className="ml-2 text-muted">
                      {formatTaille(fichier.taille)}
                      {fichier.volumeCm3 !== null && ` · ${fichier.volumeCm3} cm³`}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFichier(null)}
                    className="ml-4 shrink-0 text-xs text-muted hover:text-text"
                  >
                    Retirer
                  </button>
                </div>
                <StlViewer url={fichier.url} />
              </div>
            )}

            <div>
              <Label htmlFor="message">
                {fichier ? "Précisions sur votre pièce" : "Je n'ai pas de fichier, je décris ma pièce"}
              </Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Dimensions approximatives, usage prévu, contraintes (chaleur, extérieur, effort mécanique)…"
              />
              <Aide>
                Sans fichier 3D, on modélise la pièce pour vous — décrivez-la le plus
                précisément possible, photos et croquis bienvenus par email ensuite.
              </Aide>
            </div>
          </section>
        )}

        {etape === 1 && (
          <section className="space-y-8">
            <fieldset>
              <legend className="mb-3 text-sm font-medium">Matière</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {MATIERES.map((valeur) => {
                  const infos = MATIERE_INFOS[valeur];
                  const actif = matiere === valeur;
                  return (
                    <label
                      key={valeur}
                      className={cn(
                        "cursor-pointer rounded-xl border p-4 transition-colors",
                        actif
                          ? "border-accent bg-accent/5"
                          : "border-border bg-surface hover:border-muted/60",
                      )}
                    >
                      <input
                        type="radio"
                        name="matiere"
                        value={valeur}
                        checked={actif}
                        onChange={() => setMatiere(valeur)}
                        className="sr-only"
                      />
                      <span className="font-display block font-bold">{infos.titre}</span>
                      <span className="mt-1 block text-sm leading-relaxed">
                        {infos.resume}
                      </span>
                      <span className="mt-2 block text-xs text-muted">{infos.usages}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend className="mb-3 text-sm font-medium">Qualité d&apos;impression</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {QUALITES.map((valeur) => {
                  const infos = QUALITE_INFOS[valeur];
                  const actif = qualite === valeur;
                  return (
                    <label
                      key={valeur}
                      className={cn(
                        "cursor-pointer rounded-xl border p-4 transition-colors",
                        actif
                          ? "border-accent bg-accent/5"
                          : "border-border bg-surface hover:border-muted/60",
                      )}
                    >
                      <input
                        type="radio"
                        name="qualite"
                        value={valeur}
                        checked={actif}
                        onChange={() => setQualite(valeur)}
                        className="sr-only"
                      />
                      <span className="block font-semibold">
                        {infos.titre}{" "}
                        <span className="font-normal text-muted">({infos.couche})</span>
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted">
                        {infos.resume}
                      </span>
                      <span className="mt-2 block text-xs text-muted">{infos.delai}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="couleur" optionnel>
                  Couleur souhaitée
                </Label>
                <Input
                  id="couleur"
                  value={couleur}
                  onChange={(e) => setCouleur(e.target.value)}
                  placeholder="Noir, gris anthracite, orange…"
                />
                <Aide>On vous confirmera la disponibilité du coloris au devis.</Aide>
              </div>

              <div>
                <Label htmlFor="quantite">Quantité</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variante="secondaire"
                    taille="sm"
                    aria-label="Diminuer la quantité"
                    onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                  >
                    −
                  </Button>
                  <Input
                    id="quantite"
                    type="number"
                    min={1}
                    max={500}
                    value={quantite}
                    onChange={(e) =>
                      setQuantite(Math.min(500, Math.max(1, Number(e.target.value) || 1)))
                    }
                    className="w-24 text-center"
                  />
                  <Button
                    type="button"
                    variante="secondaire"
                    taille="sm"
                    aria-label="Augmenter la quantité"
                    onClick={() => setQuantite((q) => Math.min(500, q + 1))}
                  >
                    +
                  </Button>
                </div>
                <Aide>Remise à partir de 3 pièces, puis de 5 pièces.</Aide>
              </div>
            </div>
          </section>
        )}

        {etape === 2 && (
          <section className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  autoComplete="name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="telephone" optionnel>
                Téléphone
              </Label>
              <Input
                id="telephone"
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                autoComplete="tel"
              />
              <Aide>Utile si votre pièce demande une précision rapide.</Aide>
            </div>

            <div>
              <Label htmlFor="message-contact" optionnel>
                Message
              </Label>
              <Textarea
                id="message-contact"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="border-t border-border pt-5">
              <ChoixLivraison
                etat={livraison}
                onChange={(maj) => setLivraison((l) => ({ ...l, ...maj }))}
                masseG={masseG}
                fraisParMode={fraisParMode}
                modes={modesLivraison}
              />
            </div>

            {/* Honeypot anti-spam : invisible pour un humain */}
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label htmlFor="website">Ne pas remplir</label>
              <input
                id="website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <p className="text-xs leading-relaxed text-muted">
              Vos données servent uniquement à traiter cette demande. Voir la{" "}
              <a href="/confidentialite" className="text-accent hover:underline">
                politique de confidentialité
              </a>
              .
            </p>
          </section>
        )}

        {erreur && <Erreur>{erreur}</Erreur>}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            type="button"
            variante="fantome"
            onClick={() => setEtape((e) => Math.max(0, e - 1))}
            disabled={etape === 0 || envoi}
          >
            Retour
          </Button>

          {etape < ETAPES.length - 1 ? (
            <Button type="button" onClick={suivant} disabled={televersement}>
              Continuer
            </Button>
          ) : (
            <Button type="button" onClick={envoyer} disabled={envoi}>
              {envoi ? "Envoi…" : "Envoyer ma demande"}
            </Button>
          )}
        </div>
      </div>

      {/* Récapitulatif */}
      <aside className="rounded-xl border border-border bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-bold">Récapitulatif</h2>
        <dl className="mt-4 space-y-2.5 text-sm">
          <LigneRecap label="Fichier" valeur={fichier?.nom ?? "Sans fichier"} />
          <LigneRecap label="Matière" valeur={MATIERE_INFOS[matiere].titre} />
          <LigneRecap
            label="Qualité"
            valeur={`${QUALITE_INFOS[qualite].titre} (${QUALITE_INFOS[qualite].couche})`}
          />
          <LigneRecap label="Couleur" valeur={couleur || "À définir"} />
          <LigneRecap label="Quantité" valeur={String(quantite)} />
          {grille.mode !== "FORFAIT" && (
            <>
              <LigneRecap
                label="Volume"
                valeur={
                  fichier?.volumeCm3
                    ? `${fichier.volumeCm3} cm³`
                    : `≈ ${grille.volumeParDefaut} cm³`
                }
              />
              {detail.masseG !== null && (
                <LigneRecap label="Matière" valeur={`≈ ${detail.masseG} g`} />
              )}
              {detail.heures !== null && (
                <LigneRecap
                  label="Temps machine"
                  valeur={`≈ ${detail.heures.toFixed(1)} h`}
                />
              )}
            </>
          )}
        </dl>

        <div className="mt-5 space-y-2.5 border-t border-border pt-5 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted">Impression</span>
            <span className="font-medium">{formatPrix(detail.total)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted">
              {LIVRAISON_INFOS[livraison.mode].titre}
            </span>
            <span className="font-medium">
              {fraisPort === null
                ? "Sur devis"
                : fraisPort === 0
                  ? "Gratuit"
                  : formatPrix(fraisPort)}
            </span>
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <p className="text-xs text-muted">Estimation indicative</p>
          <p className="font-display mt-1 text-3xl font-bold text-accent">
            {formatPrix(detail.total + (fraisPort ?? 0))}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            {detail.volumeEstime && grille.mode !== "FORFAIT"
              ? "Prix HT non contractuel, calculé sur un volume moyen faute de fichier 3D. Joignez un STL pour une estimation nettement plus juste."
              : "Prix HT non contractuel : le devis ferme vous est envoyé sous 24 à 48 h après examen de la pièce."}
          </p>
        </div>
      </aside>
    </div>
  );
}

function LigneRecap({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="truncate text-right font-medium">{valeur}</dd>
    </div>
  );
}
