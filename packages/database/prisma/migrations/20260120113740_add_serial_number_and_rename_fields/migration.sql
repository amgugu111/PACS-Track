-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MANAGER', 'OPERATOR');

-- CreateTable
CREATE TABLE "rice_mills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "licenseNo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rice_mills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "riceMillId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "districts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "state" TEXT,
    "riceMillId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "districts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "societies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "riceMillId" TEXT NOT NULL,
    "address" TEXT,
    "contactNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "societies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fatherName" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "societyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gate_pass_entries" (
    "id" TEXT NOT NULL,
    "serialNumber" SERIAL NOT NULL,
    "tokenNo" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partyName" TEXT NOT NULL,
    "pacsName" TEXT NOT NULL,
    "vehicleNo" TEXT NOT NULL,
    "bags" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "remarks" TEXT,
    "challanNo" TEXT,
    "riceMillId" TEXT NOT NULL,
    "societyId" TEXT NOT NULL,
    "farmerId" TEXT NOT NULL,
    "districtId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gate_pass_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rice_mills_email_key" ON "rice_mills"("email");

-- CreateIndex
CREATE UNIQUE INDEX "rice_mills_licenseNo_key" ON "rice_mills"("licenseNo");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_riceMillId_idx" ON "users"("riceMillId");

-- CreateIndex
CREATE UNIQUE INDEX "districts_code_key" ON "districts"("code");

-- CreateIndex
CREATE INDEX "districts_riceMillId_idx" ON "districts"("riceMillId");

-- CreateIndex
CREATE UNIQUE INDEX "districts_name_riceMillId_key" ON "districts"("name", "riceMillId");

-- CreateIndex
CREATE INDEX "societies_riceMillId_idx" ON "societies"("riceMillId");

-- CreateIndex
CREATE UNIQUE INDEX "societies_code_riceMillId_key" ON "societies"("code", "riceMillId");

-- CreateIndex
CREATE INDEX "gate_pass_entries_tokenNo_idx" ON "gate_pass_entries"("tokenNo");

-- CreateIndex
CREATE INDEX "gate_pass_entries_date_idx" ON "gate_pass_entries"("date");

-- CreateIndex
CREATE INDEX "gate_pass_entries_serialNumber_idx" ON "gate_pass_entries"("serialNumber");

-- CreateIndex
CREATE INDEX "gate_pass_entries_partyName_idx" ON "gate_pass_entries"("partyName");

-- CreateIndex
CREATE INDEX "gate_pass_entries_vehicleNo_idx" ON "gate_pass_entries"("vehicleNo");

-- CreateIndex
CREATE INDEX "gate_pass_entries_riceMillId_idx" ON "gate_pass_entries"("riceMillId");

-- CreateIndex
CREATE INDEX "gate_pass_entries_societyId_idx" ON "gate_pass_entries"("societyId");

-- CreateIndex
CREATE INDEX "gate_pass_entries_farmerId_idx" ON "gate_pass_entries"("farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "gate_pass_entries_tokenNo_riceMillId_key" ON "gate_pass_entries"("tokenNo", "riceMillId");

-- CreateIndex
CREATE UNIQUE INDEX "gate_pass_entries_serialNumber_riceMillId_key" ON "gate_pass_entries"("serialNumber", "riceMillId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_riceMillId_fkey" FOREIGN KEY ("riceMillId") REFERENCES "rice_mills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "districts" ADD CONSTRAINT "districts_riceMillId_fkey" FOREIGN KEY ("riceMillId") REFERENCES "rice_mills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "societies" ADD CONSTRAINT "societies_riceMillId_fkey" FOREIGN KEY ("riceMillId") REFERENCES "rice_mills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "societies" ADD CONSTRAINT "societies_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmers" ADD CONSTRAINT "farmers_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_pass_entries" ADD CONSTRAINT "gate_pass_entries_riceMillId_fkey" FOREIGN KEY ("riceMillId") REFERENCES "rice_mills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_pass_entries" ADD CONSTRAINT "gate_pass_entries_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_pass_entries" ADD CONSTRAINT "gate_pass_entries_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gate_pass_entries" ADD CONSTRAINT "gate_pass_entries_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
