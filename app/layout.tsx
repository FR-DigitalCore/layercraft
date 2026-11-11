import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

// IBM Plex : dessinée pour la documentation technique, et la paire
// sans/mono partage les mêmes proportions, ce qui tient les tableaux.
const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
});

// Renseigner GOOGLE_SITE_VERIFICATION pour valider la propriété du domaine
// dans la Search Console sans toucher au DNS. Absente, aucune balise n'est
// émise.
const verificationGoogle = process.env.GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `Impression 3D en ligne – Devis immédiat – ${site.nom}`,
    template: `%s – ${site.nom}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: site.nom,
    title: `Impression 3D en ligne – Devis immédiat – ${site.nom}`,
    description: site.description,
    url: site.url,
  },
  twitter: {
    card: "summary_large_image",
    title: `Impression 3D en ligne – Devis immédiat – ${site.nom}`,
    description: site.description,
  },
  ...(verificationGoogle
    ? { verification: { google: verificationGoogle } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#eef0f1",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className={`${plexSans.variable} ${plexMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
