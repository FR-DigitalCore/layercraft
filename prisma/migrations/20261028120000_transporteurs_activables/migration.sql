-- CreateTable
CREATE TABLE "TransporteurConfig" (
    "transporteur" "ModeLivraison" NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransporteurConfig_pkey" PRIMARY KEY ("transporteur")
);

