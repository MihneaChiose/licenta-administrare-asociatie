-- CreateEnum
CREATE TYPE "UtilityType" AS ENUM ('COLD_WATER', 'HOT_WATER', 'GAS', 'ELECTRICITY', 'HEATING');

-- CreateTable
CREATE TABLE "Meter" (
    "id" TEXT NOT NULL,
    "apartmentId" TEXT NOT NULL,
    "utilityType" "UtilityType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeterReading" (
    "id" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "readingValue" DECIMAL(12,3) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeterReading_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Meter_apartmentId_utilityType_key" ON "Meter"("apartmentId", "utilityType");

-- CreateIndex
CREATE UNIQUE INDEX "MeterReading_meterId_month_year_key" ON "MeterReading"("meterId", "month", "year");

-- AddForeignKey
ALTER TABLE "Meter" ADD CONSTRAINT "Meter_apartmentId_fkey" FOREIGN KEY ("apartmentId") REFERENCES "Apartment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeterReading" ADD CONSTRAINT "MeterReading_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "Meter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
