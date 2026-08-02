-- CreateTable
CREATE TABLE "TarifMatiere" (
    "matiere" TEXT NOT NULL,
    "prixBase" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarifMatiere_pkey" PRIMARY KEY ("matiere")
);

-- CreateTable
CREATE TABLE "TarifQualite" (
    "qualite" TEXT NOT NULL,
    "multiplicateur" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TarifQualite_pkey" PRIMARY KEY ("qualite")
);

-- CreateTable
CREATE TABLE "RemiseQuantite" (
    "id" TEXT NOT NULL,
    "seuil" INTEGER NOT NULL,
    "coefficient" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RemiseQuantite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RemiseQuantite_seuil_key" ON "RemiseQuantite"("seuil");

