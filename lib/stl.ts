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

export function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}
