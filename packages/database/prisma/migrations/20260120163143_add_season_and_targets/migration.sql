/*
  Warnings:

  - A unique constraint covering the columns `[code,riceMillId]` on the table `districts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `seasonId` to the `gate_pass_entries` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SeasonType" AS ENUM ('KHARIF', 'RABI');

-- DropIndex
DROP INDEX "districts_code_key";

-- AlterTable
ALTER TABLE "gate_pass_entries" ADD COLUMN     "seasonId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "type" "SeasonType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "riceMillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "society_targets" (
    "id" TEXT NOT NULL,
    "seasonId" TEXT NOT NULL,
    "societyId" TEXT NOT NULL,
    "targetQuantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "society_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seasons_riceMillId_idx" ON "seasons"("riceMillId");

-- CreateIndex
CREATE INDEX "seasons_isActive_idx" ON "seasons"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "seasons_name_riceMillId_key" ON "seasons"("name", "riceMillId");

-- CreateIndex
CREATE INDEX "society_targets_seasonId_idx" ON "society_targets"("seasonId");

-- CreateIndex
CREATE INDEX "society_targets_societyId_idx" ON "society_targets"("societyId");

-- CreateIndex
CREATE UNIQUE INDEX "society_targets_seasonId_societyId_key" ON "society_targets"("seasonId", "societyId");

-- CreateIndex
CREATE UNIQUE INDEX "districts_code_riceMillId_key" ON "districts"("code", "riceMillId");

-- CreateIndex
CREATE INDEX "gate_pass_entries_seasonId_idx" ON "gate_pass_entries"("seasonId");

-- AddForeignKey
ALTER TABLE "gate_pass_entries" ADD CONSTRAINT "gate_pass_entries_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_riceMillId_fkey" FOREIGN KEY ("riceMillId") REFERENCES "rice_mills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "society_targets" ADD CONSTRAINT "society_targets_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "seasons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "society_targets" ADD CONSTRAINT "society_targets_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
