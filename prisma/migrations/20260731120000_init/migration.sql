-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Statut" AS ENUM ('RECU', 'EN_ETUDE', 'ACCEPTE', 'EN_IMPRESSION', 'TERMINE', 'EXPEDIE', 'ANNULE');

-- CreateTable
CREATE TABLE "Devis" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "message" TEXT,
    "matiere" TEXT NOT NULL,
    "couleur" TEXT,
    "qualite" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL DEFAULT 1,
    "stlKey" TEXT,
    "stlNom" TEXT,
    "statut" "Statut" NOT NULL DEFAULT 'RECU',
    "prixEstime" DOUBLE PRECISION,
    "prixFinal" DOUBLE PRECISION,
    "noteAdmin" TEXT,

    CONSTRAINT "Devis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvenementDevis" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "devisId" TEXT NOT NULL,
    "statut" "Statut" NOT NULL,
    "commentaire" TEXT,

    CONSTRAINT "EvenementDevis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Realisation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "imageKey" TEXT NOT NULL,
    "matiere" TEXT,
    "tags" TEXT[],
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Realisation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Devis_token_key" ON "Devis"("token");

-- CreateIndex
CREATE INDEX "Devis_email_idx" ON "Devis"("email");

-- CreateIndex
CREATE INDEX "Devis_statut_idx" ON "Devis"("statut");

-- CreateIndex
CREATE INDEX "EvenementDevis_devisId_idx" ON "EvenementDevis"("devisId");

-- CreateIndex
CREATE INDEX "Realisation_visible_ordre_idx" ON "Realisation"("visible", "ordre");

-- AddForeignKey
ALTER TABLE "EvenementDevis" ADD CONSTRAINT "EvenementDevis_devisId_fkey" FOREIGN KEY ("devisId") REFERENCES "Devis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

