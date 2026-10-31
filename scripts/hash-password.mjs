#!/usr/bin/env node
/**
 * Génère le hash bcrypt à coller dans ADMIN_PASSWORD_HASH.
 * Usage : npm run hash-password -- "mon-mot-de-passe"
 */
import bcrypt from "bcryptjs";

const motDePasse = process.argv[2];

if (!motDePasse) {
  console.error('Usage : npm run hash-password -- "mon-mot-de-passe"');
  process.exit(1);
}
if (motDePasse.length < 12) {
  console.error("Choisissez un mot de passe d'au moins 12 caractères.");
  process.exit(1);
}

const hash = await bcrypt.hash(motDePasse, 12);

// Guillemets simples, impérativement : un hash bcrypt contient des `$`, et
// docker-compose interpole les valeurs entre guillemets doubles. Si les
// caractères qui suivent un `$` forment un nom de variable valide, il les
// remplace par du vide et le conteneur reçoit un hash tronqué — l'erreur
// est alors un simple « identifiants invalides », sans rien qui l'explique.
console.log(`ADMIN_PASSWORD_HASH='${hash}'`);
