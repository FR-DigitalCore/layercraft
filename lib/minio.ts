import { Client } from "minio";

const globalForMinio = globalThis as unknown as { minio: Client | undefined };

export const BUCKET_STL = process.env.MINIO_BUCKET_STL ?? "stl-files";
export const BUCKET_GALERIE = process.env.MINIO_BUCKET_GALERIE ?? "galerie";

export const minio =
  globalForMinio.minio ??
  new Client({
    endPoint: process.env.MINIO_ENDPOINT ?? "localhost",
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === "true",
    accessKey: process.env.MINIO_ACCESS_KEY ?? "minioadmin",
    secretKey: process.env.MINIO_SECRET_KEY ?? "minioadmin",
  });

if (process.env.NODE_ENV !== "production") globalForMinio.minio = minio;

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

/** URL temporaire de téléchargement (1 h par défaut). */
export async function urlSignee(
  bucket: string,
  cle: string,
  dureeSecondes = 3600,
): Promise<string> {
  return minio.presignedGetObject(bucket, cle, dureeSecondes);
}

export async function supprimerFichier(
  bucket: string,
  cle: string,
): Promise<void> {
  await minio.removeObject(bucket, cle);
}
