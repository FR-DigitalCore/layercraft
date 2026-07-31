/**
 * Jeu de données de démonstration pour le développement local.
 * Usage : npm run db:seed
 *
 * Les réalisations pointent vers des clés MinIO qui n'existent pas encore :
 * la galerie affiche alors le visuel de repli. Remplacez-les depuis
 * /admin/realisations en téléversant de vraies photos.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const REALISATIONS = [
  {
    titre: "Support de capteur sur mesure",
    description:
      "Pièce de fixation conçue à partir d'un relevé de cotes, imprimée en PETG pour résister à l'humidité de l'atelier.",
    imageKey: "demo/support-capteur.jpg",
    matiere: "PETG",
    tags: ["pièce technique", "PETG", "sur mesure"],
    ordre: 0,
  },
  {
    titre: "Engrenage de rechange",
    description:
      "Reproduction d'un engrenage cassé sur un appareil électroménager hors production.",
    imageKey: "demo/engrenage.jpg",
    matiere: "PETG",
    tags: ["pièce de rechange", "PETG"],
    ordre: 1,
  },
  {
    titre: "Boîtier extérieur pour électronique",
    description:
      "Boîtier étanche aux projections, en ASA pour tenir les UV toute l'année.",
    imageKey: "demo/boitier-asa.jpg",
    matiere: "ASA",
    tags: ["boîtier", "ASA", "extérieur"],
    ordre: 2,
  },
  {
    titre: "Patins antidérapants",
    description: "Série de 12 patins souples en TPU pour un mobilier d'atelier.",
    imageKey: "demo/patins-tpu.jpg",
    matiere: "TPU",
    tags: ["série", "TPU"],
    ordre: 3,
  },
];

async function main() {
  for (const realisation of REALISATIONS) {
    const existante = await prisma.realisation.findFirst({
      where: { imageKey: realisation.imageKey },
    });
    if (existante) continue;
    await prisma.realisation.create({ data: realisation });
  }

  const devisDemo = await prisma.devis.findFirst({ where: { email: "demo@example.com" } });
  if (!devisDemo) {
    const devis = await prisma.devis.create({
      data: {
        token: "demo000000000000000000ab",
        nom: "Camille Démo",
        email: "demo@example.com",
        telephone: "06 12 34 56 78",
        message: "Support d'étagère à reproduire, environ 8 cm de long.",
        matiere: "PETG",
        couleur: "Noir",
        qualite: "standard",
        quantite: 2,
        prixEstime: 20,
        statut: "EN_ETUDE",
        evenements: {
          create: [
            { statut: "RECU", commentaire: "Demande reçue via le site" },
            { statut: "EN_ETUDE", commentaire: "Chiffrage en cours" },
          ],
        },
      },
    });
    console.log(`Devis de démonstration : /suivi/${devis.token}`);
  }

  console.log("Seed terminé.");
}

main()
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
