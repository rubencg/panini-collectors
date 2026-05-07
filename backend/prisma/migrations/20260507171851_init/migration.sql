-- CreateTable
CREATE TABLE "Person" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonSticker" (
    "id" SERIAL NOT NULL,
    "personId" INTEGER NOT NULL,
    "stickerId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PersonSticker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_name_key" ON "Person"("name");

-- CreateIndex
CREATE INDEX "PersonSticker_personId_idx" ON "PersonSticker"("personId");

-- CreateIndex
CREATE UNIQUE INDEX "PersonSticker_personId_stickerId_key" ON "PersonSticker"("personId", "stickerId");

-- AddForeignKey
ALTER TABLE "PersonSticker" ADD CONSTRAINT "PersonSticker_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
