/*
  Warnings:

  - Changed the type of `paymentStatus` on the `emi_entities` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "emi_entities" DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "emi_entities_paymentStatus_idx" ON "emi_entities"("paymentStatus");
