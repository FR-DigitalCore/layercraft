import type { NextConfig } from "next";

// Le navigateur charge les images de la galerie via des presigned URLs signées
// sur l'endpoint public de MinIO (voir lib/minio.ts) : c'est cet hôte-là qu'il
// faut autoriser, pas le nom de service interne du réseau Docker.
// Les deux fichiers doivent donc résoudre l'endpoint de la même façon.
// Repli tout-ou-rien, comme lib/ts : sans endpoint public, on reprend
// l'interne en entier, sinon l'hôte et le port seraient dépareillés.
const minioPublic = process.env.MINIO_PUBLIC_ENDPOINT;
const minioHost = minioPublic || process.env.MINIO_ENDPOINT || "localhost";
const minioPort = minioPublic
  ? process.env.MINIO_PUBLIC_PORT || "443"
  : process.env.MINIO_PORT || "9000";
const minioSsl = minioPublic
  ? (process.env.MINIO_PUBLIC_USE_SSL ?? "true") === "true"
  : process.env.MINIO_USE_SSL === "true";

const nextConfig: NextConfig = {
  // Image Docker minimale (voir Dockerfile)
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: minioSsl ? "https" : "http",
        hostname: minioHost,
        // Un port vide signifie « port par défaut du protocole » (443 / 80),
        // ce qui est le cas derrière le reverse proxy.
        port: (minioSsl && minioPort === "443") || minioPort === "80" ? "" : minioPort,
        pathname: "/**",
      },
    ],
  },
  eslint: {
    // Le lint tourne en CI / en local via `npm run lint`, pas pendant le build image.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
