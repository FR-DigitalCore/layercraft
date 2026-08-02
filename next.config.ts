import type { NextConfig } from "next";

// Le navigateur charge les images de la galerie via des presigned URLs signées
// sur l'endpoint public de MinIO (voir lib/minio.ts) : c'est cet hôte-là qu'il
// faut autoriser, pas le nom de service interne du réseau Docker.
const minioHost =
  process.env.MINIO_PUBLIC_ENDPOINT || process.env.MINIO_ENDPOINT || "localhost";
const minioPort = process.env.MINIO_PUBLIC_PORT || process.env.MINIO_PORT || "9000";
const minioSsl =
  (process.env.MINIO_PUBLIC_USE_SSL ?? process.env.MINIO_USE_SSL ?? "false") === "true";

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
