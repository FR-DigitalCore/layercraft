-- AlterTable
ALTER TABLE "Devis" ADD COLUMN     "volumeCm3" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "TarifMatiere" ADD COLUMN     "densite" DOUBLE PRECISION NOT NULL DEFAULT 1.24,
ADD COLUMN     "prixParGramme" DOUBLE PRECISION NOT NULL DEFAULT 0.08;

-- AlterTable
ALTER TABLE "TarifQualite" ADD COLUMN     "debitCm3ParHeure" DOUBLE PRECISION NOT NULL DEFAULT 8;

-- CreateTable
CREATE TABLE "ParametresTarification" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "mode" TEXT NOT NULL DEFAULT 'FORFAIT',
    "fraisMiseEnRoute" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "prixHoraire" DOUBLE PRECISION NOT NULL DEFAULT 4,
    "tauxRemplissage" DOUBLE PRECISION NOT NULL DEFAULT 0.25,
    "volumeParDefaut" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ParametresTarification_pkey" PRIMARY KEY ("id")
);

