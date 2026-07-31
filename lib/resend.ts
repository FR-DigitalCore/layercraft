import { Resend } from "resend";
import { site } from "@/lib/site";

const apiKey = process.env.RESEND_API_KEY;

const client = apiKey ? new Resend(apiKey) : null;

type Email = {
  to: string;
  subject: string;
  html: string;
};

/**
 * Sans RESEND_API_KEY (dev, CI), les emails sont loggés au lieu d'être envoyés.
 * Un échec d'envoi ne doit jamais faire échouer la création d'un devis :
 * on log et on renvoie false.
 */
export async function envoyerEmail({ to, subject, html }: Email): Promise<boolean> {
  if (!client) {
    console.info(`[email:dev] → ${to} — ${subject}`);
    return false;
  }
  try {
    const { error } = await client.emails.send({
      from: process.env.RESEND_FROM ?? `devis@${new URL(site.url).hostname}`,
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[email] échec d'envoi", error);
      return false;
    }
    return true;
  } catch (erreur) {
    console.error("[email] exception", erreur);
    return false;
  }
}
