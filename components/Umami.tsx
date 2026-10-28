"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  cheminMesurable,
  UMAMI_SITE_ID,
  UMAMI_URL,
  umamiActif,
} from "@/lib/analytics";

declare global {
  interface Window {
    umami?: {
      track: (
        nom?: string | Record<string, unknown>,
        donnees?: Record<string, unknown>,
      ) => void;
    };
  }
}

/**
 * Mesure d'audience Umami, sans cookie ni identifiant persistant.
 *
 * Le suivi automatique est désactivé : Umami remonterait sinon l'URL de
 * chaque page, dont /suivi/<jeton>, ce qui recopierait des références de
 * commande secrètes dans les statistiques. Les vues sont donc envoyées à la
 * main, et seulement pour les chemins autorisés.
 */
export function Umami() {
  const chemin = usePathname();
  const pret = useRef(false);

  useEffect(() => {
    if (!pret.current || !chemin || !cheminMesurable(chemin)) return;
    window.umami?.track();
  }, [chemin]);

  if (!umamiActif()) return null;

  return (
    <Script
      src={`${UMAMI_URL.replace(/\/$/, "")}/script.js`}
      data-website-id={UMAMI_SITE_ID}
      data-auto-track="false"
      data-do-not-track="true"
      strategy="afterInteractive"
      onLoad={() => {
        pret.current = true;
        if (chemin && cheminMesurable(chemin)) window.umami?.track();
      }}
    />
  );
}
