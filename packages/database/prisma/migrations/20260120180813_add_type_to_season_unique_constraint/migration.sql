/*
  Warnings:

  - A unique constraint covering the columns `[name,type,riceMillId]` on the table `seasons` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "seasons_name_riceMillId_key";

-- CreateIndex
CREATE UNIQUE INDEX "seasons_name_type_riceMillId_key" ON "seasons"("name", "type", "riceMillId");
