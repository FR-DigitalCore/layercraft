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

console.log(await bcrypt.hash(motDePasse, 12));
