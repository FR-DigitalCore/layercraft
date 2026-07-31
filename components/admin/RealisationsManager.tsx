"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { RealisationAffichee } from "@/lib/realisations";
import { Button } from "@/components/ui/Button";
import { Aide, Erreur, Input, Label, Textarea } from "@/components/ui/Field";
import { Badge, Card } from "@/components/ui/Card";

type Brouillon = {
  titre: string;
  description: string;
  matiere: string;
  tags: string;
  ordre: string;
  imageKey: string;
  imageUrl: string;
};

const VIDE: Brouillon = {
  titre: "",
  description: "",
  matiere: "",
  tags: "",
  ordre: "0",
  imageKey: "",
  imageUrl: "",
};

export function RealisationsManager({
  realisations,
}: {
  realisations: RealisationAffichee[];
}) {
  const router = useRouter();
  const [brouillon, setBrouillon] = useState<Brouillon>(VIDE);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [televersement, setTeleversement] = useState(false);
  const inputFichier = useRef<HTMLInputElement>(null);

  function maj(champ: keyof Brouillon, valeur: string) {
    setBrouillon((b) => ({ ...b, [champ]: valeur }));
  }

  async function televerser(fichier: File) {
    setErreur(null);
    setTeleversement(true);
    try {
      const donnees = new FormData();
      donnees.append("file", fichier);
      const reponse = await fetch("/api/upload/image", { method: "POST", body: donnees });
      const corps = await reponse.json();
      if (!reponse.ok) throw new Error(corps.erreur ?? "Envoi impossible.");
      setBrouillon((b) => ({ ...b, imageKey: corps.key, imageUrl: corps.url }));
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setTeleversement(false);
    }
  }

  async function creer() {
    setErreur(null);
    if (!brouillon.imageKey) return setErreur("Ajoutez une photo.");
    if (brouillon.titre.trim().length < 2) return setErreur("Indiquez un titre.");

    setEnvoi(true);
    try {
      const reponse = await fetch("/api/realisations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: brouillon.titre,
          description: brouillon.description,
          matiere: brouillon.matiere,
          imageKey: brouillon.imageKey,
          ordre: Number(brouillon.ordre) || 0,
          visible: true,
          tags: brouillon.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const corps = await reponse.json();
      if (!reponse.ok) throw new Error(corps.erreur ?? "Création impossible.");
      setBrouillon(VIDE);
      router.refresh();
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setEnvoi(false);
    }
  }

  async function modifier(id: string, donnees: Record<string, unknown>) {
    const reponse = await fetch(`/api/realisations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(donnees),
    });
    if (!reponse.ok) {
      const corps = await reponse.json().catch(() => ({}));
      setErreur(corps.erreur ?? "Mise à jour impossible.");
      return;
    }
    router.refresh();
  }

  async function supprimer(id: string, titre: string) {
    if (!confirm(`Supprimer « ${titre} » ? Cette action est définitive.`)) return;
    const reponse = await fetch(`/api/realisations/${id}`, { method: "DELETE" });
    if (!reponse.ok) {
      setErreur("Suppression impossible.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[22rem_1fr] lg:items-start">
      <Card className="lg:sticky lg:top-6">
        <h2 className="mb-5 text-lg font-semibold">Ajouter une réalisation</h2>

        <div className="space-y-4">
          <div>
            <Label>Photo</Label>
            {brouillon.imageUrl ? (
              <div className="relative aspect-4/3 overflow-hidden rounded-lg border border-border">
                <Image
                  src={brouillon.imageUrl}
                  alt="Aperçu"
                  fill
                  sizes="22rem"
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-6 text-center">
                <p className="text-xs text-muted">JPEG, PNG ou WebP — 10 Mo maximum</p>
              </div>
            )}
            <Button
              type="button"
              variante="secondaire"
              taille="sm"
              className="mt-3 w-full"
              disabled={televersement}
              onClick={() => inputFichier.current?.click()}
            >
              {televersement
                ? "Envoi…"
                : brouillon.imageUrl
                  ? "Remplacer la photo"
                  : "Choisir une photo"}
            </Button>
            <input
              ref={inputFichier}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void televerser(f);
                e.target.value = "";
              }}
            />
          </div>

          <div>
            <Label htmlFor="titre">Titre</Label>
            <Input
              id="titre"
              value={brouillon.titre}
              onChange={(e) => maj("titre", e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="description" optionnel>
              Description
            </Label>
            <Textarea
              id="description"
              value={brouillon.description}
              onChange={(e) => maj("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="matiere" optionnel>
                Matière
              </Label>
              <Input
                id="matiere"
                value={brouillon.matiere}
                onChange={(e) => maj("matiere", e.target.value)}
                placeholder="PETG"
              />
            </div>
            <div>
              <Label htmlFor="ordre">Ordre</Label>
              <Input
                id="ordre"
                type="number"
                min={0}
                value={brouillon.ordre}
                onChange={(e) => maj("ordre", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tags" optionnel>
              Tags
            </Label>
            <Input
              id="tags"
              value={brouillon.tags}
              onChange={(e) => maj("tags", e.target.value)}
              placeholder="pièce technique, PETG"
            />
            <Aide>Séparés par des virgules. Ils servent de filtres sur la galerie.</Aide>
          </div>

          {erreur && <Erreur>{erreur}</Erreur>}

          <Button type="button" className="w-full" onClick={creer} disabled={envoi}>
            {envoi ? "Ajout…" : "Ajouter"}
          </Button>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold">
          {realisations.length} réalisation{realisations.length > 1 ? "s" : ""}
        </h2>

        {realisations.length === 0 ? (
          <Card className="mt-4 text-center text-sm text-muted">
            Aucune réalisation pour le moment.
          </Card>
        ) : (
          <ul className="mt-4 space-y-3">
            {realisations.map((r) => (
              <li key={r.id}>
                <Card className="flex flex-col gap-4 p-4 sm:flex-row">
                  <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-lg border border-border sm:w-40">
                    <Image
                      src={r.imageUrl}
                      alt={r.titre}
                      fill
                      sizes="10rem"
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{r.titre}</p>
                      {!r.visible && <Badge>Masquée</Badge>}
                      <span className="text-xs text-muted">ordre {r.ordre}</span>
                    </div>
                    {r.matiere && <p className="mt-0.5 text-xs text-muted">{r.matiere}</p>}
                    {r.description && (
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{r.description}</p>
                    )}
                    {r.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {r.tags.map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variante="secondaire"
                        taille="sm"
                        onClick={() => modifier(r.id, { visible: !r.visible })}
                      >
                        {r.visible ? "Masquer" : "Afficher"}
                      </Button>
                      <Button
                        type="button"
                        variante="secondaire"
                        taille="sm"
                        onClick={() => modifier(r.id, { ordre: Math.max(0, r.ordre - 1) })}
                      >
                        Monter
                      </Button>
                      <Button
                        type="button"
                        variante="secondaire"
                        taille="sm"
                        onClick={() => modifier(r.id, { ordre: r.ordre + 1 })}
                      >
                        Descendre
                      </Button>
                      <Button
                        type="button"
                        variante="danger"
                        taille="sm"
                        onClick={() => supprimer(r.id, r.titre)}
                      >
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
