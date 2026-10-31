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

// Le shell substitue `$nom` avant que node ne voie l'argument : entre
// guillemets doubles, un mot de passe contenant un `$` arrive amputé. Le
// hash produit est alors valide, mais ne correspond pas au mot de passe
// qu'on croit avoir choisi — et la connexion échoue sans rien expliquer.
// On ne peut pas le détecter ici, on affiche donc de quoi s'en rendre
// compte tout de suite.
console.error(`Hash d'un mot de passe de ${motDePasse.length} caractères.`);
console.error("Si ce n'est pas la longueur attendue, votre shell en a mangé");
console.error("une partie : relancez avec des guillemets simples.\n");

const hash = await bcrypt.hash(motDePasse, 12);

// Guillemets simples, impérativement : un hash bcrypt contient des `$`, et
// docker-compose interpole les valeurs entre guillemets doubles. Si les
// caractères qui suivent un `$` forment un nom de variable valide, il les
// remplace par du vide et le conteneur reçoit un hash tronqué — l'erreur
// est alors un simple « identifiants invalides », sans rien qui l'explique.
console.log(`ADMIN_PASSWORD_HASH='${hash}'`);
