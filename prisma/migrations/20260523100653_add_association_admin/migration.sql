/*
  Warnings:

  - Added the required column `adminId` to the `Association` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Association" ADD COLUMN     "adminId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Association" ADD CONSTRAINT "Association_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
