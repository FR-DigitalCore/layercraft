#!/usr/bin/env node
/**
 * Vérifie l'accès à l'API Mondial Relay, sans dépendre de l'application.
 *
 *   node --env-file-if-exists=.env scripts/tester-mondial-relay.mjs [code-postal]
 *
 * Lit MONDIAL_RELAY_ENSEIGNE et MONDIAL_RELAY_CLE_PRIVEE, affiche la chaîne
 * signée (clé masquée), envoie la requête et interprète la réponse.
 *
 * L'intérêt est d'isoler le point le plus fragile de l'intégration : l'ordre
 * exact des champs dans la signature. Un seul champ oublié ou mal placé la
 * fait rejeter, avec un code d'erreur peu bavard.
 */
import { createHash } from "node:crypto";

const URL_API = "https://api.mondialrelay.com/Web_Services.asmx";

// Ordre imposé par la documentation : il détermine la signature ET le corps
// SOAP. Les champs vides comptent.
const CHAMPS = [
  "Enseigne",
  "Pays",
  "NumPointRelais",
  "Ville",
  "CP",
  "Latitude",
  "Longitude",
  "Taille",
  "Poids",
  "Action",
  "DelaiEnvoi",
  "RayonRecherche",
  "TypeActivite",
  "NombreResultats",
];

const CODES_STAT = {
  "0": "Succès",
  "1": "Enseigne invalide",
  "2": "Numéro d'enseigne vide ou inexistant",
  "3": "Numéro de compte enseigne invalide",
  "8": "Mot de passe ou hachage invalide — ordre de la signature à revoir",
  "9": "Ville non reconnue ou non unique",
  "20": "Code postal invalide",
  "24": "Pays invalide",
  "99": "Erreur générique du service",
};

const enseigne = process.env.MONDIAL_RELAY_ENSEIGNE;
const clePrivee = process.env.MONDIAL_RELAY_CLE_PRIVEE;
const codePostal = process.argv[2] ?? "75001";

if (!enseigne || !clePrivee) {
  console.error(
    "Renseignez MONDIAL_RELAY_ENSEIGNE et MONDIAL_RELAY_CLE_PRIVEE,\n" +
      "dans .env ou dans l'environnement, puis relancez.",
  );
  process.exit(1);
}
if (!/^\d{5}$/.test(codePostal)) {
  console.error("Code postal attendu sur 5 chiffres.");
  process.exit(1);
}

const parametres = {
  Enseigne: enseigne,
  Pays: "FR",
  CP: codePostal,
  NombreResultats: "5",
};

const concatenation = CHAMPS.map((c) => parametres[c] ?? "").join("");
const securite = createHash("md5")
  .update(concatenation + clePrivee, "utf8")
  .digest("hex")
  .toUpperCase();

console.log("Enseigne       :", enseigne, `(${enseigne.length} caractères`,
  enseigne.length === 8 ? "— attendu 8, correct)" : "— la doc en attend 8 !)");
console.log("Chaîne signée  :", concatenation + "•".repeat(clePrivee.length));
console.log("Security (MD5) :", securite);

const corps = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <WSI4_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
${CHAMPS.map((c) => `      <${c}>${parametres[c] ?? ""}</${c}>`).join("\n")}
      <Security>${securite}</Security>
    </WSI4_PointRelais_Recherche>
  </soap:Body>
</soap:Envelope>`;

console.log("\nAppel de", URL_API, "…");

let reponse;
try {
  reponse = await fetch(URL_API, {
    method: "POST",
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      SOAPAction: "http://www.mondialrelay.fr/webservice/WSI4_PointRelais_Recherche",
    },
    body: corps,
    signal: AbortSignal.timeout(15000),
  });
} catch (erreur) {
  console.error("\nAppel impossible :", erreur.message);
  console.error("Vérifiez votre accès réseau sortant vers api.mondialrelay.com.");
  process.exit(1);
}

const xml = await reponse.text();
console.log("HTTP           :", reponse.status);

const lire = (nom) => (new RegExp(`<${nom}>([^<]*)</${nom}>`).exec(xml) ?? [, ""])[1].trim();
const stat = lire("STAT");

if (!reponse.ok) {
  console.error("\nRéponse en erreur. Début du corps :\n", xml.slice(0, 800));
  process.exit(1);
}

console.log("STAT           :", stat || "(absent)", "—", CODES_STAT[stat] ?? "code non répertorié");

if (stat !== "0") {
  console.error(
    "\nÉchec. Si STAT vaut 8, c'est la signature : comparez l'ordre des champs\n" +
      "ci-dessus avec le tableau de la documentation V-5.14, section\n" +
      "WSI4_PointRelais_Recherche.",
  );
  console.error("\nDébut de la réponse :\n", xml.slice(0, 800));
  process.exit(1);
}

const points = [...xml.matchAll(/<PointRelais_Details>([\s\S]*?)<\/PointRelais_Details>/g)];
console.log(`\n${points.length} point(s) relais autour du ${codePostal} :\n`);

for (const [, bloc] of points) {
  const champ = (nom) =>
    (new RegExp(`<${nom}>([^<]*)</${nom}>`).exec(bloc) ?? [, ""])[1].trim();
  console.log(
    `  ${champ("Num").padEnd(10)} ${champ("LgAdr1")} — ${champ("LgAdr3")}, ` +
      `${champ("CP")} ${champ("Ville")}`,
  );
}

console.log("\nL'authentification fonctionne : vous pouvez renseigner ces");
console.log("identifiants dans .env, l'application utilisera la même signature.");
