export const TAILLE_MAX_STL = 50 * 1024 * 1024; // 50 Mo
export const EXTENSIONS_STL = [".stl"];

/**
 * Validation serveur d'un STL : l'extension seule ne prouve rien.
 * - STL binaire : en-tête 80 octets + uint32 (nb de triangles) + 50 octets par triangle
 * - STL ASCII : commence par "solid" et contient au moins une facette
 */
export function estStlValide(buffer: Buffer): boolean {
  if (buffer.length < 15) return false;

  // Binaire
  if (buffer.length >= 84) {
    const nbTriangles = buffer.readUInt32LE(80);
    if (nbTriangles > 0 && buffer.length === 84 + nbTriangles * 50) return true;
  }

  // ASCII — on n'inspecte que le début et la fin pour rester peu coûteux
  const debut = buffer.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
  if (debut.startsWith("solid")) {
    const echantillon = buffer.subarray(0, 65_536).toString("utf8").toLowerCase();
    return echantillon.includes("facet normal") || echantillon.includes("endsolid");
  }

  return false;
}

export function extensionAutorisee(nomFichier: string): boolean {
  const nom = nomFichier.toLowerCase();
  return EXTENSIONS_STL.some((ext) => nom.endsWith(ext));
}

/**
 * Volume du maillage en cm³, par somme des volumes signés des tétraèdres
 * formés avec l'origine. Le signe s'annule pour les faces opposées : le
 * résultat est correct pour un maillage fermé, quelle que soit sa position.
 * Les STL sont exprimés en millimètres.
 *
 * Renvoie null si le fichier n'est pas exploitable (ASCII, maillage vide).
 */
export function calculerVolumeCm3(buffer: Buffer): number | null {
  if (buffer.length < 84) return null;

  const nbTriangles = buffer.readUInt32LE(80);
  if (nbTriangles === 0 || buffer.length !== 84 + nbTriangles * 50) {
    // STL ASCII : parsing non implémenté, le volume reste inconnu.
    return null;
  }

  let volumeMm3 = 0;

  for (let i = 0; i < nbTriangles; i++) {
    // 84 = en-tête ; +12 pour sauter le vecteur normal de la facette
    const base = 84 + i * 50 + 12;

    const ax = buffer.readFloatLE(base);
    const ay = buffer.readFloatLE(base + 4);
    const az = buffer.readFloatLE(base + 8);
    const bx = buffer.readFloatLE(base + 12);
    const by = buffer.readFloatLE(base + 16);
    const bz = buffer.readFloatLE(base + 20);
    const cx = buffer.readFloatLE(base + 24);
    const cy = buffer.readFloatLE(base + 28);
    const cz = buffer.readFloatLE(base + 32);

    volumeMm3 +=
      (ax * (by * cz - bz * cy) -
        ay * (bx * cz - bz * cx) +
        az * (bx * cy - by * cx)) /
      6;
  }

  const volumeCm3 = Math.abs(volumeMm3) / 1000;
  if (!Number.isFinite(volumeCm3) || volumeCm3 <= 0) return null;

  return Math.round(volumeCm3 * 100) / 100;
}

export function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}
