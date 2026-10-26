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

/** L'API attend un MD5 de la concaténation des paramètres suivis de la clé. */
function signature(valeurs: string[]): string {
  const cle = process.env.MONDIAL_RELAY_CLE_PRIVEE ?? "";
  return createHash("md5")
    .update(valeurs.join("") + cle, "utf8")
    .digest("hex")
    .toUpperCase();
}

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

  const enseigne = process.env.MONDIAL_RELAY_ENSEIGNE!;
  const pays = "FR";
  const nb = String(Math.min(30, Math.max(1, nombre)));

  const corps = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <WSI4_PointRelais_Recherche xmlns="http://www.mondialrelay.fr/webservice/">
      <Enseigne>${enseigne}</Enseigne>
      <Pays>${pays}</Pays>
      <CP>${codePostal}</CP>
      <NombreResultats>${nb}</NombreResultats>
      <Security>${signature([enseigne, pays, "", codePostal, "", "", "", "", "", nb])}</Security>
    </WSI4_PointRelais_Recherche>
  </soap:Body>
</soap:Envelope>`;

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
      console.error("[mondial-relay] code d'erreur", statut);
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
