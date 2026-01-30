-- AlterTable
ALTER TABLE "gate_pass_entries" ALTER COLUMN "serialNumber" DROP DEFAULT;
DROP SEQUENCE "gate_pass_entries_serialNumber_seq";
