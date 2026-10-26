import { Client } from "minio";

const globalForMinio = globalThis as unknown as {
  minio: Client | undefined;
  minioPublic: Client | undefined;
};

export const BUCKET_STL = process.env.MINIO_BUCKET_STL ?? "stl-files";
export const BUCKET_GALERIE = process.env.MINIO_BUCKET_GALERIE ?? "galerie";

const identifiants = {
  accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
  secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
  // Indispensable, et pas seulement une optimisation : sans région explicite,
  // le client la résout par un appel réseau à son propre endpoint. Le client
  // public viserait alors l'hôte public depuis l'intérieur du conteneur, où
  // il n'est pas joignable, et la signature échouerait alors même que le
  // fichier est déjà stocké.
  region: process.env.MINIO_REGION || "us-east-1",
};

const endpointInterne = {
  host: process.env.MINIO_ENDPOINT || "localhost",
  port: Number(process.env.MINIO_PORT || 9000),
  ssl: process.env.MINIO_USE_SSL === "true",
};

/**
 * Endpoint public utilisé pour signer les URLs destinées au navigateur.
 * En Docker, l'app joint MinIO par le nom de service `minio`, que le
 * navigateur ne sait pas résoudre : la signature couvrant le Host, elle doit
 * être calculée sur le domaine réellement visité.
 *
 * Le repli est tout-ou-rien : sans MINIO_PUBLIC_ENDPOINT, on reprend
 * l'endpoint interne en entier. Mélanger l'hôte interne avec le port et le
 * TLS publics donnerait une URL injoignable (https://localhost:443).
 */
export const endpointPublic = process.env.MINIO_PUBLIC_ENDPOINT
  ? {
      host: process.env.MINIO_PUBLIC_ENDPOINT,
      port: Number(process.env.MINIO_PUBLIC_PORT || 443),
      ssl: (process.env.MINIO_PUBLIC_USE_SSL ?? "true") === "true",
    }
  : endpointInterne;

/** Client interne : lectures, écritures et administration des buckets. */
export const minio =
  globalForMinio.minio ??
  new Client({
    endPoint: endpointInterne.host,
    port: endpointInterne.port,
    useSSL: endpointInterne.ssl,
    ...identifiants,
  });

/** Client dédié à la signature des URLs remises au navigateur. */
const minioPublic =
  globalForMinio.minioPublic ??
  new Client({
    endPoint: endpointPublic.host,
    port: endpointPublic.port,
    useSSL: endpointPublic.ssl,
    ...identifiants,
  });

if (process.env.NODE_ENV !== "production") {
  globalForMinio.minio = minio;
  globalForMinio.minioPublic = minioPublic;
}

/** Les buckets restent privés : tout accès passe par une presigned URL. */
export async function assurerBucket(bucket: string): Promise<void> {
  if (!(await minio.bucketExists(bucket))) {
    await minio.makeBucket(bucket);
  }
}

export async function envoyerFichier(
  bucket: string,
  cle: string,
  contenu: Buffer,
  contentType: string,
): Promise<void> {
  await assurerBucket(bucket);
  await minio.putObject(bucket, cle, contenu, contenu.length, {
    "Content-Type": contentType,
  });
}

export async function lireFichier(bucket: string, cle: string): Promise<Buffer> {
  const flux = await minio.getObject(bucket, cle);
  const morceaux: Buffer[] = [];
  for await (const morceau of flux) {
    morceaux.push(morceau as Buffer);
  }
  const buffer = Buffer.concat(morceaux);
  if (buffer.length === 0) {
    throw new Error(`Fichier vide ou introuvable : ${bucket}/${cle}`);
  }
  return buffer;
}

/**
 * URL temporaire de téléchargement (1 h par défaut), signée sur l'endpoint
 * public pour être utilisable depuis le navigateur.
 */
export async function urlSignee(
  bucket: string,
  cle: string,
  dureeSecondes = 3600,
): Promise<string> {
  return minioPublic.presignedGetObject(bucket, cle, dureeSecondes);
}

export async function supprimerFichier(
  bucket: string,
  cle: string,
): Promise<void> {
  await minio.removeObject(bucket, cle);
}
