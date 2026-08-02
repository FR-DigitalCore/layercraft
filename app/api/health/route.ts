import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sonde de vivacité du conteneur (healthcheck Docker, supervision Nginx).
 * Volontairement sans accès base ni stockage : elle répond « le process Next
 * sert des requêtes », pas « toute la stack va bien ». Une sonde qui tombe
 * parce que Postgres redémarre ferait redémarrer l'app pour rien.
 */
export async function GET() {
  return NextResponse.json({ ok: true, horodatage: new Date().toISOString() });
}
