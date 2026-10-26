-- CreateEnum
CREATE TYPE "ModeLivraison" AS ENUM ('RETRAIT', 'COLISSIMO', 'MONDIAL_RELAY');

-- AlterEnum
ALTER TYPE "Statut" ADD VALUE 'PAYE';

-- AlterTable
ALTER TABLE "Devis" ADD COLUMN     "adresseLigne1" TEXT,
ADD COLUMN     "adresseLigne2" TEXT,
ADD COLUMN     "codePostal" TEXT,
ADD COLUMN     "fraisPort" DOUBLE PRECISION,
ADD COLUMN     "masseG" DOUBLE PRECISION,
ADD COLUMN     "modeLivraison" "ModeLivraison" NOT NULL DEFAULT 'RETRAIT',
ADD COLUMN     "payeLe" TIMESTAMP(3),
ADD COLUMN     "pays" TEXT NOT NULL DEFAULT 'FR',
ADD COLUMN     "pointRelaisId" TEXT,
ADD COLUMN     "pointRelaisNom" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "stripeSessionId" TEXT,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "ville" TEXT;

-- CreateTable
CREATE TABLE "TarifLivraison" (
    "id" TEXT NOT NULL,
    "transporteur" "ModeLivraison" NOT NULL,
    "poidsMaxG" INTEGER NOT NULL,
    "prix" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarifLivraison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TarifLivraison_transporteur_poidsMaxG_key" ON "TarifLivraison"("transporteur", "poidsMaxG");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Devis_stripeSessionId_key" ON "Devis"("stripeSessionId");

-- CreateIndex
CREATE INDEX "Devis_userId_idx" ON "Devis"("userId");

-- AddForeignKey
ALTER TABLE "Devis" ADD CONSTRAINT "Devis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

