import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

/**
 * Chemins protégés par l'authentification. La liste reprend exactement le
 * `matcher` d'origine : le middleware s'exécute désormais sur tout le site
 * pour servir la maintenance, mais la garde d'authentification ne doit
 * s'appliquer qu'où elle s'appliquait déjà.
 */
const PROTEGES = [
  /^\/admin(\/|$)/,
  /^\/mon-compte(\/|$)/,
  /^\/api\/commandes(\/|$)/,
  /^\/api\/realisations(\/|$)/,
  /^\/api\/tarifs$/,
  /^\/api\/livraison$/,
  /^\/api\/mes-devis(\/|$)/,
  /^\/api\/upload\/image$/,
];

/**
 * Chemins qui restent servis pendant une maintenance : l'administration,
 * pour que l'atelier continue de traiter les devis en cours, les routes
 * d'API, et les fichiers que le navigateur ou les robots réclament.
 */
const HORS_MAINTENANCE =
  /^\/(maintenance|admin|api|icon\.png|apple-icon\.png|opengraph-image\.png|favicon\.ico|manifest\.webmanifest|robots\.txt|sitemap\.xml)(\/|$)/;

function enMaintenance(chemin: string): boolean {
  return process.env.MAINTENANCE === "1" && !HORS_MAINTENANCE.test(chemin);
}

// Le mode maintenance est lu ici, dans le middleware, et non dans les
// réécritures de next.config : celles-ci sont figées au build, il aurait
// fallu reconstruire l'image pour rallumer le site.
export default function middleware(requete: NextRequest, evenement: unknown) {
  const chemin = requete.nextUrl.pathname;

  if (enMaintenance(chemin)) {
    const url = requete.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.rewrite(url);
  }

  if (PROTEGES.some((motif) => motif.test(chemin))) {
    return (auth as unknown as (r: NextRequest, e: unknown) => Response)(
      requete,
      evenement,
    );
  }

  return NextResponse.next();
}

export const config = {
  // Tout le site, hors fichiers statiques servis par Next lui-même.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
