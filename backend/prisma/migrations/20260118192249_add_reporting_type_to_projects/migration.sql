-- CreateEnum
CREATE TYPE "ReportingType" AS ENUM ('duration', 'startEnd');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "reporting_type" "ReportingType" NOT NULL DEFAULT 'startEnd';
