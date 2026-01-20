/*
  Warnings:

  - Added the required column `year` to the `seasons` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "seasons" ADD COLUMN     "year" TEXT NOT NULL;
