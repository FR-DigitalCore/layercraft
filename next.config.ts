import type { NextConfig } from "next";

const minioHost = process.env.MINIO_ENDPOINT ?? "localhost";
const minioPort = process.env.MINIO_PORT ?? "9000";
const minioSsl = process.env.MINIO_USE_SSL === "true";

const nextConfig: NextConfig = {
  // Image Docker minimale (voir Dockerfile)
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: minioSsl ? "https" : "http",
        hostname: minioHost,
        port: minioPort,
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
