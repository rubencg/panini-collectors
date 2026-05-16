-- CreateTable
CREATE TABLE "PackOpening" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackOpening_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackOpeningItem" (
    "id" SERIAL NOT NULL,
    "packOpeningId" INTEGER NOT NULL,
    "stickerId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,

    CONSTRAINT "PackOpeningItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PackOpening_personId_idx" ON "PackOpening"("personId");

-- CreateIndex
CREATE INDEX "PackOpeningItem_packOpeningId_idx" ON "PackOpeningItem"("packOpeningId");

-- AddForeignKey
ALTER TABLE "PackOpening" ADD CONSTRAINT "PackOpening_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackOpeningItem" ADD CONSTRAINT "PackOpeningItem_packOpeningId_fkey" FOREIGN KEY ("packOpeningId") REFERENCES "PackOpening"("id") ON DELETE CASCADE ON UPDATE CASCADE;
