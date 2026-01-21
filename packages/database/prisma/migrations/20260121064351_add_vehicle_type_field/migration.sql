-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('TRACTOR', 'TRUCK', 'TATA_ACE');

-- AlterTable
ALTER TABLE "gate_pass_entries" ADD COLUMN     "vehicleType" "VehicleType" NOT NULL DEFAULT 'TRUCK',
ALTER COLUMN "vehicleNo" DROP NOT NULL;
