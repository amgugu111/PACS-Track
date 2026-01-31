-- AlterTable: Split bags into gunnyBags and otherBags
-- This migration safely preserves existing data by copying bags values to otherBags

-- Step 1: Add new columns with default values
ALTER TABLE "gate_pass_entries" ADD COLUMN "gunnyBags" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "gate_pass_entries" ADD COLUMN "otherBags" INTEGER NOT NULL DEFAULT 0;

-- Step 2: Migrate existing data - copy all existing bags values to otherBags
UPDATE "gate_pass_entries" SET "otherBags" = "bags" WHERE "bags" IS NOT NULL;

-- Step 3: Now safe to drop the old bags column (data is preserved in otherBags)
ALTER TABLE "gate_pass_entries" DROP COLUMN "bags";
