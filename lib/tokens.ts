import { randomBytes } from "node:crypto";

/**
 * Token de suivi public : imprévisible et court à recopier.
 * 24 caractères base32-like sans caractères ambigus (0/O, 1/I/l).
 */
const ALPHABET = "23456789abcdefghijkmnpqrstuvwxyz";

export function genererToken(longueur = 24): string {
  const octets = randomBytes(longueur);
  let token = "";
  for (let i = 0; i < longueur; i++) {
    token += ALPHABET[octets[i] % ALPHABET.length];
  }
  return token;
}

/** Clé de stockage MinIO préfixée par la date, pour garder les buckets lisibles. */
export function genererCleFichier(prefixe: string, nomFichier: string): string {
  const extension = nomFichier.split(".").pop()?.toLowerCase() ?? "bin";
  const jour = new Date().toISOString().slice(0, 10);
  return `${prefixe}/${jour}/${genererToken(16)}.${extension}`;
}
