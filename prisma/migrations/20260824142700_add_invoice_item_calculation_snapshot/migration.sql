/*
  Warnings:

  - Made the column `sourceType` on table `InvoiceItem` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "InvoiceItem" DROP CONSTRAINT "InvoiceItem_invoiceId_fkey";

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN     "basisTotal" DECIMAL(14,3),
ADD COLUMN     "basisUnit" TEXT,
ADD COLUMN     "basisValue" DECIMAL(14,3),
ADD COLUMN     "distributionMethod" "ExpenseDistributionMethod",
ADD COLUMN     "expenseCategory" "ExpenseCategory",
ADD COLUMN     "sharePercentage" DECIMAL(9,6),
ADD COLUMN     "sourceAmount" DECIMAL(10,2),
ALTER COLUMN "sourceType" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "InvoiceItem" ADD CONSTRAINT "InvoiceItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
