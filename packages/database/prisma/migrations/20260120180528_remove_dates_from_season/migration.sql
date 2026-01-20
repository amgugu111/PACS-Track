/*
  Warnings:

  - You are about to drop the column `endDate` on the `seasons` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `seasons` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `seasons` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "seasons" DROP COLUMN "endDate",
DROP COLUMN "startDate",
DROP COLUMN "year";
