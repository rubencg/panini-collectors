-- AlterTable
ALTER TABLE "PersonSticker" ADD COLUMN "extra" INTEGER NOT NULL DEFAULT 0;

-- Backfill: existing dupes (count > 1) become extra copies; clamp count to 1
UPDATE "PersonSticker" SET "extra" = GREATEST(0, count - 1), "count" = 1 WHERE count > 1;
