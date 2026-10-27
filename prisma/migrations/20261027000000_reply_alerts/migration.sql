-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alertEmail" TEXT NOT NULL DEFAULT '';
