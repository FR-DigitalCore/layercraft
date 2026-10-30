import "server-only";
import { createHash } from "node:crypto";

export type PointRelais = {
  id: string;
  nom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  latitude?: number;
  longitude?: number;
};

const URL_API = "https://api.mondialrelay.com/Web_Services.asmx";

/**
 * La recherche de points relais nécessite un compte Mondial Relay :
 * un code enseigne et une clé privée, fournis au contrat. Sans eux, la
 * fonction renvoie `null` et l'interface bascule sur la saisie manuelle
 * plutôt que d'afficher une liste vide trompeuse.
 */
export function mondialRelayConfigure(): boolean {
  return Boolean(
    process.env.MONDIAL_RELAY_ENSEIGNE && process.env.MONDIAL_RELAY_CLE_PRIVEE,
  );
}

/**
 * Paramètres de WSI4_PointRelais_Recherche, dans l'ordre exact de la
 * documentation. Cet ordre est doublement structurant : il détermine la
 * concaténation signée, et l'ordre des éléments du corps SOAP.
 *
 * Les champs inutilisés comptent quand même, sous forme de chaîne vide :
 * les omettre décale tout le reste et la signature est rejetée.
 */
export const CHAMPS_RECHERCHE = [
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
] as const;

export type ParametresRecherche = Partial<
  Record<(typeof CHAMPS_RECHERCHE)[number], string>
>;

/** Chaîne signée : tous les champs concaténés, puis la clé privée. */
export function chaineASigner(
  parametres: ParametresRecherche,
  clePrivee: string,
): string {
  return CHAMPS_RECHERCHE.map((champ) => parametres[champ] ?? "").join("") + clePrivee;
}

/** L'API attend le MD5 en majuscules de cette concaténation. */
export function signature(
  parametres: ParametresRecherche,
  clePrivee = process.env.MONDIAL_RELAY_CLE_PRIVEE ?? "",
): string {
  return createHash("md5")
    .update(chaineASigner(parametres, clePrivee), "utf8")
    .digest("hex")
    .toUpperCase();
}

/** Corps SOAP, éléments émis dans l'ordre imposé par le service. */
export function corpsRecherche(parametres: ParametresRecherche): string {
  const elements = CHAMPS_RECHERCHE.map(
    (champ) => `      <${champ}>${parametres[champ] ?? ""}</${champ}>`,
  ).join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <WSI4_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
${elements}
      <Security>${signature(parametres)}</Security>
    </WSI4_PointRelais_Recherche>
  </soap:Body>
</soap:Envelope>`;
}

/** Codes STAT les plus courants, pour un diagnostic lisible. */
export const CODES_STAT: Record<string, string> = {
  "0": "Succès",
  "1": "Enseigne invalide",
  "2": "Numéro d'enseigne vide ou inexistant",
  "3": "Numéro de compte enseigne invalide",
  "5": "Numéro de dossier enseigne invalide",
  "8": "Mot de passe ou hachage invalide",
  "9": "Ville non reconnue ou non unique",
  "10": "Type de collecte invalide",
  "20": "Code postal invalide",
  "24": "Pays invalide",
  "30": "Numéro de téléphone invalide",
  "80": "Code tracing : colis inconnu",
  "99": "Erreur générique du service",
};

function champ(xml: string, nom: string): string {
  const trouve = new RegExp(`<${nom}>([^<]*)</${nom}>`).exec(xml);
  return trouve ? trouve[1].trim() : "";
}

/**
 * Points relais autour d'un code postal.
 * Renvoie null si le service n'est pas configuré ou injoignable : l'appelant
 * distingue ainsi « aucun point trouvé » de « recherche indisponible ».
 */
export async function chercherPointsRelais(
  codePostal: string,
  nombre = 10,
): Promise<PointRelais[] | null> {
  if (!mondialRelayConfigure()) return null;

  const corps = corpsRecherche({
    Enseigne: process.env.MONDIAL_RELAY_ENSEIGNE!,
    Pays: "FR",
    CP: codePostal,
    NombreResultats: String(Math.min(30, Math.max(1, nombre))),
  });

  try {
    const reponse = await fetch(URL_API, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "http://www.mondialrelay.fr/webservice/WSI4_PointRelais_Recherche",
      },
      body: corps,
      signal: AbortSignal.timeout(8000),
    });

    if (!reponse.ok) {
      console.error("[mondial-relay] réponse", reponse.status);
      return null;
    }

    const xml = await reponse.text();
    const statut = champ(xml, "STAT");
    if (statut && statut !== "0") {
      console.error(
        `[mondial-relay] code ${statut} — ${CODES_STAT[statut] ?? "code inconnu"}`,
      );
      return null;
    }

    return [...xml.matchAll(/<PointRelais_Details>([\s\S]*?)<\/PointRelais_Details>/g)]
      .map(([, bloc]) => ({
        id: champ(bloc, "Num"),
        nom: champ(bloc, "LgAdr1"),
        adresse: [champ(bloc, "LgAdr3"), champ(bloc, "LgAdr4")]
          .filter(Boolean)
          .join(", "),
        codePostal: champ(bloc, "CP"),
        ville: champ(bloc, "Ville"),
        latitude: Number(champ(bloc, "Latitude").replace(",", ".")) || undefined,
        longitude: Number(champ(bloc, "Longitude").replace(",", ".")) || undefined,
      }))
      .filter((point) => point.id);
  } catch (erreur) {
    console.error("[mondial-relay] recherche impossible", erreur);
    return null;
  }
}
