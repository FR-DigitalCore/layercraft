import type { Devis } from "@prisma/client";
import { site } from "@/lib/site";
import { envoyerEmail } from "@/lib/resend";
import { formatPrix, MATIERE_INFOS, QUALITE_INFOS, type Matiere, type Qualite } from "@/lib/prix";
import { STATUT_INFOS } from "@/lib/statuts";

function gabarit(titre: string, corps: string): string {
  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f5f4f2;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e3df;border-radius:12px">
    <tr><td style="padding:24px 28px;border-bottom:1px solid #e5e3df">
      <span style="font-size:18px;font-weight:700;letter-spacing:-0.02em">${site.nom}</span>
      <span style="color:#ff6b2b">.</span>
    </td></tr>
    <tr><td style="padding:28px">
      <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3">${titre}</h1>
      ${corps}
    </td></tr>
    <tr><td style="padding:20px 28px;border-top:1px solid #e5e3df;font-size:12px;color:#777">
      ${site.nom} — ${site.zone}<br>
      ${site.email} · ${site.telephone}
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Échappe systématiquement la valeur : elle vient presque toujours d'un champ
 * rempli par le demandeur (nom, couleur, nom de fichier, téléphone). Sans
 * cela, un devis au nom de `<a href="…">` injecte du HTML dans l'email reçu
 * par l'atelier comme dans celui du client.
 */
function ligne(label: string, valeur: string): string {
  return `<tr>
    <td style="padding:6px 0;color:#777;font-size:14px;width:140px">${echapper(label)}</td>
    <td style="padding:6px 0;font-size:14px;font-weight:600">${echapper(valeur)}</td>
  </tr>`;
}

function recapitulatif(devis: Devis): string {
  const matiere = MATIERE_INFOS[devis.matiere as Matiere];
  const qualite = QUALITE_INFOS[devis.qualite as Qualite];
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:8px 0 20px">
    ${ligne("Matière", matiere ? matiere.titre : devis.matiere)}
    ${ligne("Qualité", qualite ? `${qualite.titre} (${qualite.couche})` : devis.qualite)}
    ${devis.couleur ? ligne("Couleur", devis.couleur) : ""}
    ${ligne("Quantité", String(devis.quantite))}
    ${devis.stlNom ? ligne("Fichier", devis.stlNom) : ""}
    ${devis.prixEstime !== null ? ligne("Estimation", formatPrix(devis.prixEstime)) : ""}
  </table>`;
}

function bouton(url: string, libelle: string): string {
  return `<a href="${echapper(url)}" style="display:inline-block;background:#ff6b2b;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px">${echapper(libelle)}</a>`;
}

export function urlSuivi(token: string): string {
  return `${site.url}/suivi/${token}`;
}

export async function envoyerConfirmationClient(devis: Devis): Promise<boolean> {
  const lien = urlSuivi(devis.token);
  return envoyerEmail({
    to: devis.email,
    subject: `Votre demande de devis — ${site.nom}`,
    html: gabarit(
      `Bonjour ${echapper(devis.nom)}, votre demande est bien reçue.`,
      `<p style="font-size:14px;line-height:1.6;color:#444">
         Nous revenons vers vous sous 24 à 48 h ouvrées avec un devis ferme.
         Voici le récapitulatif de votre demande :
       </p>
       ${recapitulatif(devis)}
       <p style="font-size:13px;line-height:1.6;color:#777">
         L'estimation affichée est indicative et non contractuelle : elle ne tient pas
         compte du volume réel de la pièce ni du temps machine.
       </p>
       <p style="margin:24px 0 8px">${bouton(lien, "Suivre ma demande")}</p>
       <p style="font-size:12px;color:#999;word-break:break-all">${lien}</p>
       <p style="font-size:13px;line-height:1.6;color:#777">
         Vous pouvez aussi retrouver toutes vos demandes au même endroit en vous
         connectant avec cette adresse email, sans mot de passe :
         <a href="${site.url}/connexion" style="color:#ff6b2b">${site.url}/connexion</a>
       </p>`,
    ),
  });
}

export async function envoyerNotificationAdmin(devis: Devis): Promise<boolean> {
  const destinataire = process.env.ADMIN_NOTIF_EMAIL;
  if (!destinataire) {
    console.warn("[email] ADMIN_NOTIF_EMAIL non défini, notification ignorée");
    return false;
  }
  return envoyerEmail({
    to: destinataire,
    subject: `Nouveau devis — ${devis.nom} (${devis.matiere} ×${devis.quantite})`,
    html: gabarit(
      "Nouvelle demande de devis",
      `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:8px 0 20px">
         ${ligne("Nom", devis.nom)}
         ${ligne("Email", devis.email)}
         ${devis.telephone ? ligne("Téléphone", devis.telephone) : ""}
       </table>
       ${recapitulatif(devis)}
       ${
         devis.message
           ? `<p style="font-size:14px;line-height:1.6;color:#444;background:#f7f6f4;padding:12px;border-radius:8px;white-space:pre-wrap">${echapper(devis.message)}</p>`
           : ""
       }
       <p style="margin:24px 0 0">${bouton(`${site.url}/admin/commandes/${devis.id}`, "Ouvrir dans l'admin")}</p>`,
    ),
  });
}

export async function envoyerChangementStatut(
  devis: Devis,
  lienPaiement?: string | null,
): Promise<boolean> {
  const infos = STATUT_INFOS[devis.statut];
  return envoyerEmail({
    to: devis.email,
    subject: `Votre commande : ${infos.label} — ${site.nom}`,
    html: gabarit(
      `Votre commande passe à « ${infos.label} »`,
      `<p style="font-size:14px;line-height:1.6;color:#444">${infos.description}</p>
       ${recapitulatif(devis)}
       ${
         lienPaiement
           ? `<p style="margin:24px 0 8px">${bouton(lienPaiement, "Régler en ligne")}</p>
              <p style="font-size:12px;color:#999">Paiement sécurisé par Stripe. Le lien reste valable sept jours ; passé ce délai, relancez le règlement depuis votre page de suivi.</p>`
           : ""
       }
       ${
         devis.prixFinal !== null
           ? `<p style="font-size:14px"><strong>Prix final : ${formatPrix(devis.prixFinal)}</strong></p>`
           : ""
       }
       ${
         devis.noteAdmin
           ? `<p style="font-size:14px;line-height:1.6;color:#444;background:#f7f6f4;padding:12px;border-radius:8px;white-space:pre-wrap">${echapper(devis.noteAdmin)}</p>`
           : ""
       }
       <p style="margin:24px 0 0">${bouton(urlSuivi(devis.token), "Voir le suivi")}</p>`,
    ),
  });
}

export async function envoyerLienMagique(
  destinataire: string,
  lien: string,
  validiteMinutes: number,
): Promise<boolean> {
  // Un lien magique est un identifiant de connexion à usage unique : l'écrire
  // dans les logs revient à l'exposer à quiconque les lit. On ne le fait donc
  // qu'en développement, et seulement quand aucun envoi réel n'est possible.
  if (process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY) {
    console.info(`[lien-magique:dev] ${destinataire} → ${lien}`);
  }

  return envoyerEmail({
    to: destinataire,
    subject: `Votre lien de connexion — ${site.nom}`,
    html: gabarit(
      "Connectez-vous à votre espace",
      `<p style="font-size:14px;line-height:1.6;color:#444">
         Cliquez sur le bouton ci-dessous pour accéder à vos demandes et suivre
         vos commandes. Ce lien est valable ${validiteMinutes} minutes et ne
         fonctionne qu'une seule fois.
       </p>
       <p style="margin:24px 0 8px">${bouton(lien, "Me connecter")}</p>
       <p style="font-size:12px;color:#999;word-break:break-all">${lien}</p>
       <p style="font-size:13px;line-height:1.6;color:#777">
         Vous n'êtes pas à l'origine de cette demande ? Ignorez cet email,
         aucun accès ne sera ouvert.
       </p>`,
    ),
  });
}

/** Les guillemets sont échappés aussi : `echapper` sert également en
 *  contexte d'attribut, dans le href des boutons. */
function echapper(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
