-- AlterTable
ALTER TABLE "societies" ADD COLUMN     "block" TEXT;

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "riceMillId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicles_riceMillId_idx" ON "vehicles"("riceMillId");

-- CreateIndex
CREATE INDEX "vehicles_vehicleType_idx" ON "vehicles"("vehicleType");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicleNo_riceMillId_key" ON "vehicles"("vehicleNo", "riceMillId");

-- CreateIndex
CREATE INDEX "districts_name_idx" ON "districts"("name");

-- CreateIndex
CREATE INDEX "districts_state_idx" ON "districts"("state");

-- CreateIndex
CREATE INDEX "gate_pass_entries_districtId_idx" ON "gate_pass_entries"("districtId");

-- CreateIndex
CREATE INDEX "gate_pass_entries_pacsName_idx" ON "gate_pass_entries"("pacsName");

-- CreateIndex
CREATE INDEX "gate_pass_entries_challanNo_idx" ON "gate_pass_entries"("challanNo");

-- CreateIndex
CREATE INDEX "gate_pass_entries_riceMillId_seasonId_idx" ON "gate_pass_entries"("riceMillId", "seasonId");

-- CreateIndex
CREATE INDEX "gate_pass_entries_riceMillId_date_idx" ON "gate_pass_entries"("riceMillId", "date");

-- CreateIndex
CREATE INDEX "gate_pass_entries_riceMillId_societyId_idx" ON "gate_pass_entries"("riceMillId", "societyId");

-- CreateIndex
CREATE INDEX "gate_pass_entries_riceMillId_districtId_idx" ON "gate_pass_entries"("riceMillId", "districtId");

-- CreateIndex
CREATE INDEX "gate_pass_entries_seasonId_societyId_idx" ON "gate_pass_entries"("seasonId", "societyId");

-- CreateIndex
CREATE INDEX "gate_pass_entries_seasonId_date_idx" ON "gate_pass_entries"("seasonId", "date");

-- CreateIndex
CREATE INDEX "gate_pass_entries_date_riceMillId_seasonId_idx" ON "gate_pass_entries"("date", "riceMillId", "seasonId");

-- CreateIndex
CREATE INDEX "parties_societyId_idx" ON "parties"("societyId");

-- CreateIndex
CREATE INDEX "parties_name_idx" ON "parties"("name");

-- CreateIndex
CREATE INDEX "parties_phone_idx" ON "parties"("phone");

-- CreateIndex
CREATE INDEX "parties_societyId_name_idx" ON "parties"("societyId", "name");

-- CreateIndex
CREATE INDEX "seasons_riceMillId_isActive_idx" ON "seasons"("riceMillId", "isActive");

-- CreateIndex
CREATE INDEX "seasons_type_idx" ON "seasons"("type");

-- CreateIndex
CREATE INDEX "societies_districtId_idx" ON "societies"("districtId");

-- CreateIndex
CREATE INDEX "societies_name_idx" ON "societies"("name");

-- CreateIndex
CREATE INDEX "societies_riceMillId_districtId_idx" ON "societies"("riceMillId", "districtId");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_riceMillId_fkey" FOREIGN KEY ("riceMillId") REFERENCES "rice_mills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
