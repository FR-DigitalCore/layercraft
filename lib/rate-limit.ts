/**
 * Limiteur de débit en mémoire (fenêtre glissante simple).
 * Suffisant pour une instance unique sur VPS ; à remplacer par Redis
 * le jour où l'app tourne en plusieurs répliques.
 */
type Compteur = { total: number; expireA: number };

const compteurs = new Map<string, Compteur>();

export function limiter(
  cle: string,
  max: number,
  fenetreMs: number,
): { autorise: boolean; resteSecondes: number } {
  const maintenant = Date.now();
  const actuel = compteurs.get(cle);

  if (!actuel || actuel.expireA <= maintenant) {
    compteurs.set(cle, { total: 1, expireA: maintenant + fenetreMs });
    return { autorise: true, resteSecondes: 0 };
  }

  actuel.total += 1;
  if (actuel.total > max) {
    return {
      autorise: false,
      resteSecondes: Math.ceil((actuel.expireA - maintenant) / 1000),
    };
  }
  return { autorise: true, resteSecondes: 0 };
}

/** Purge périodique pour éviter que la Map ne grossisse indéfiniment. */
if (typeof setInterval === "function") {
  const timer = setInterval(() => {
    const maintenant = Date.now();
    for (const [cle, valeur] of compteurs) {
      if (valeur.expireA <= maintenant) compteurs.delete(cle);
    }
  }, 60_000);
  timer.unref?.();
}

export function ipDepuisRequete(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "inconnu";
}
