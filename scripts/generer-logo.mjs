#!/usr/bin/env node
/**
 * Régénère les visuels dérivés du logo depuis design/logo-source.png.
 *   node scripts/generer-logo.mjs
 *
 * La source est restée orange. La rotation de teinte ci-dessous l'amène sur
 * l'ambre de la charte : +24° place le dégradé autour de 42°, la teinte de
 * #f2a900. Au-delà de +30° les tons clairs virent au jaune-vert.
 *
 * C'est un dépannage : un logo redessiné directement en ambre vaudrait
 * mieux qu'un original recoloré.
 */
import sharp from "sharp";

const SOURCE = "design/logo-source.png";
const ROTATION_TEINTE = 24;
const SATURATION = 0.95;

const ambre = (fichier) =>
  sharp(fichier).modulate({ hue: ROTATION_TEINTE, saturation: SATURATION });

// Carré centré sur le pictogramme, découpé dans la source : le fond est
// légèrement vignetté, recoller un extrait sur un aplat laisserait une
// couture visible.
const CARRE = { left: 349, top: 188, width: 556, height: 556 };
const LOCKUP = { left: 95, top: 239, width: 1063, height: 720 };

for (const [cible, taille] of [
  ["public/marque.png", 512],
  ["app/icon.png", 512],
  ["app/apple-icon.png", 180],
]) {
  await ambre(SOURCE).extract(CARRE).resize(taille, taille).png().toFile(cible);
}

await ambre(SOURCE).extract(LOCKUP).resize(1024).png().toFile("public/logo.png");

// Open Graph : la source entière mise à l'échelle, rognée du vide haut et
// bas, élargie avec la couleur du pourtour — uniforme, donc sans couture.
const base = await ambre(SOURCE)
  .resize(860, 860)
  .extract({ left: 0, top: 115, width: 860, height: 630 })
  .toBuffer();

await sharp({
  create: { width: 1200, height: 630, channels: 4, background: { r: 15, g: 15, b: 17, alpha: 1 } },
})
  .composite([{ input: base, gravity: "center" }])
  .png()
  .toFile("app/opengraph-image.png");

console.log("visuels régénérés en ambre");
