/** Mesure d'audience Umami, désactivée tant qu'elle n'est pas configurée. */

export const UMAMI_URL = process.env.NEXT_PUBLIC_UMAMI_URL ?? "";
export const UMAMI_SITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? "";

export function umamiActif(): boolean {
  return Boolean(UMAMI_URL && UMAMI_SITE_ID);
}

/**
 * Chemins jamais remontés à la mesure d'audience.
 *
 * Les URL de suivi contiennent le jeton de commande : les envoyer à l'outil
 * de statistiques reviendrait à y recopier un secret, consultable ensuite par
 * quiconque a accès au tableau de bord. L'espace client et les pages
 * d'authentification sont exclus pour la même raison.
 */
const CHEMINS_EXCLUS = ["/suivi", "/mon-compte", "/connexion", "/admin", "/api"];

export function cheminMesurable(chemin: string): boolean {
  return !CHEMINS_EXCLUS.some(
    (exclu) => chemin === exclu || chemin.startsWith(`${exclu}/`),
  );
}
