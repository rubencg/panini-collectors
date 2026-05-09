-- CreateTable
CREATE TABLE "SwapRequest" (
    "id" SERIAL NOT NULL,
    "fromPersonId" INTEGER NOT NULL,
    "toPersonId" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "SwapRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SwapRequestItem" (
    "id" SERIAL NOT NULL,
    "swapRequestId" INTEGER NOT NULL,
    "stickerId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,

    CONSTRAINT "SwapRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SwapRequest_fromPersonId_idx" ON "SwapRequest"("fromPersonId");

-- CreateIndex
CREATE INDEX "SwapRequest_toPersonId_idx" ON "SwapRequest"("toPersonId");

-- CreateIndex
CREATE INDEX "SwapRequestItem_swapRequestId_idx" ON "SwapRequestItem"("swapRequestId");

-- AddForeignKey
ALTER TABLE "SwapRequest" ADD CONSTRAINT "SwapRequest_fromPersonId_fkey" FOREIGN KEY ("fromPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapRequest" ADD CONSTRAINT "SwapRequest_toPersonId_fkey" FOREIGN KEY ("toPersonId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SwapRequestItem" ADD CONSTRAINT "SwapRequestItem_swapRequestId_fkey" FOREIGN KEY ("swapRequestId") REFERENCES "SwapRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
