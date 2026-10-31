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
  try {
    const debut = buffer.subarray(0, 512).toString("utf8").trimStart().toLowerCase();
    if (debut.startsWith("solid")) {
      const echantillon = buffer.subarray(0, Math.min(65_536, buffer.length)).toString("utf8").toLowerCase();
      return echantillon.includes("facet normal") || echantillon.includes("endsolid");
    }
  } catch {
    return false;
  }

  return false;
}

export function extensionAutorisee(nomFichier: string): boolean {
  const nom = nomFichier.toLowerCase();
  return EXTENSIONS_STL.some((ext) => nom.endsWith(ext));
}

export type MesuresStl = {
  /** Volume du solide, en cm³. */
  volumeCm3: number;
  /** Aire de la surface extérieure, en cm². */
  aireCm2: number;
};

/**
 * Mesure un maillage STL binaire. Les STL sont exprimés en millimètres.
 *
 * Le volume est la somme des volumes signés des tétraèdres formés avec
 * l'origine : le signe s'annule pour les faces opposées, le résultat est
 * donc correct pour un maillage fermé, où qu'il se trouve dans l'espace.
 *
 * L'aire sert à estimer la matière réellement déposée : sur une petite
 * pièce, les parois et les couches pleines occupent presque tout le volume,
 * et le taux de remplissage ne s'applique qu'à ce qu'il en reste.
 *
 * Renvoie null si le fichier n'est pas exploitable (ASCII, maillage vide).
 */
export function mesurerStl(buffer: Buffer): MesuresStl | null {
  if (buffer.length < 84) return null;

  const nbTriangles = buffer.readUInt32LE(80);
  if (nbTriangles === 0 || buffer.length !== 84 + nbTriangles * 50) {
    // STL ASCII : parsing non implémenté, les mesures restent inconnues.
    return null;
  }

  let volumeMm3 = 0;
  let aireMm2 = 0;

  for (let i = 0; i < nbTriangles; i++) {
    // 84 = en-tête ; +12 pour sauter le vecteur normal de la facette
    const base = 84 + i * 50 + 12;

    // Vérifier que nous avons assez de données pour lire tous les floats
    if (base + 36 > buffer.length) return null;

    const ax = buffer.readFloatLE(base);
    const ay = buffer.readFloatLE(base + 4);
    const az = buffer.readFloatLE(base + 8);
    const bx = buffer.readFloatLE(base + 12);
    const by = buffer.readFloatLE(base + 16);
    const bz = buffer.readFloatLE(base + 20);
    const cx = buffer.readFloatLE(base + 24);
    const cy = buffer.readFloatLE(base + 28);
    const cz = buffer.readFloatLE(base + 32);

    // Vérifier que les valeurs sont des nombres valides
    if (!Number.isFinite(ax) || !Number.isFinite(ay) || !Number.isFinite(az) ||
        !Number.isFinite(bx) || !Number.isFinite(by) || !Number.isFinite(bz) ||
        !Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(cz)) {
      return null;
    }

    volumeMm3 +=
      (ax * (by * cz - bz * cy) -
        ay * (bx * cz - bz * cx) +
        az * (bx * cy - by * cx)) /
      6;

    // Aire du triangle : demi-norme du produit vectoriel AB ∧ AC.
    const ux = bx - ax, uy = by - ay, uz = bz - az;
    const vx = cx - ax, vy = cy - ay, vz = cz - az;
    const nx = uy * vz - uz * vy;
    const ny = uz * vx - ux * vz;
    const nz = ux * vy - uy * vx;
    aireMm2 += Math.sqrt(nx * nx + ny * ny + nz * nz) / 2;
  }

  const volumeCm3 = Math.abs(volumeMm3) / 1000;
  const aireCm2 = aireMm2 / 100;
  if (!Number.isFinite(volumeCm3) || volumeCm3 <= 0) return null;
  if (!Number.isFinite(aireCm2) || aireCm2 <= 0) return null;

  return {
    volumeCm3: Math.round(volumeCm3 * 100) / 100,
    aireCm2: Math.round(aireCm2 * 100) / 100,
  };
}

export function formatTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1)} Mo`;
}
