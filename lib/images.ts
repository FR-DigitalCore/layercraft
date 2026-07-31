export const TAILLE_MAX_IMAGE = 10 * 1024 * 1024; // 10 Mo

const SIGNATURES: Array<{ type: string; test: (b: Buffer) => boolean }> = [
  { type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    type: "image/png",
    test: (b) => b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  {
    type: "image/webp",
    test: (b) =>
      b.subarray(0, 4).toString("ascii") === "RIFF" &&
      b.subarray(8, 12).toString("ascii") === "WEBP",
  },
];

/** Le Content-Type déclaré par le client n'est pas fiable : on lit les magic bytes. */
export function detecterTypeImage(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  return SIGNATURES.find((s) => s.test(buffer))?.type ?? null;
}
