/*
  Warnings:

  - You are about to drop the column `farmerId` on the `gate_pass_entries` table. All the data in the column will be lost.
  - You are about to drop the `farmers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `partyId` to the `gate_pass_entries` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "farmers" DROP CONSTRAINT "farmers_societyId_fkey";

-- DropForeignKey
ALTER TABLE "gate_pass_entries" DROP CONSTRAINT "gate_pass_entries_farmerId_fkey";

-- DropIndex
DROP INDEX "gate_pass_entries_farmerId_idx";

-- AlterTable
ALTER TABLE "gate_pass_entries" DROP COLUMN "farmerId",
ADD COLUMN     "partyId" TEXT NOT NULL;

-- DropTable
DROP TABLE "farmers";

-- CreateTable
CREATE TABLE "parties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fatherName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "societyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parties_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "gate_pass_entries_partyId_idx" ON "gate_pass_entries"("partyId");

-- AddForeignKey
ALTER TABLE "parties" ADD CONSTRAINT "parties_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_pass_entries" ADD CONSTRAINT "gate_pass_entries_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "parties"("id") ON DELETE CASCADE ON UPDATE CASCADE;
