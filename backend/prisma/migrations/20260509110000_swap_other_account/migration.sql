ALTER TABLE "SwapRequest" ADD COLUMN "fromForOtherAccount" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SwapRequest" ADD COLUMN "toForOtherAccount" BOOLEAN NOT NULL DEFAULT false;
