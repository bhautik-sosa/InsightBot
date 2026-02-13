/*
  Warnings:

  - Changed the type of `loanStatus` on the `loan_transactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `transaction_entities` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "loan_transactions" DROP COLUMN "loanStatus",
ADD COLUMN     "loanStatus" VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE "transaction_entities" DROP COLUMN "status",
ADD COLUMN     "status" VARCHAR(20) NOT NULL;

-- CreateIndex
CREATE INDEX "loan_transactions_loanStatus_idx" ON "loan_transactions"("loanStatus");

-- CreateIndex
CREATE INDEX "transaction_entities_status_idx" ON "transaction_entities"("status");
