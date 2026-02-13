/*
  Warnings:

  - The values [INPROGRESS,ACTIVE,REJECTED,COMPLETE] on the enum `LoanStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [REFUNDED] on the enum `TransactionStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "LoanStatus_new" AS ENUM ('InProcess', 'Active', 'Rejected', 'Accepted', 'Complete');
ALTER TABLE "loan_transactions" ALTER COLUMN "loanStatus" TYPE "LoanStatus_new" USING ("loanStatus"::text::"LoanStatus_new");
ALTER TYPE "LoanStatus" RENAME TO "LoanStatus_old";
ALTER TYPE "LoanStatus_new" RENAME TO "LoanStatus";
DROP TYPE "public"."LoanStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "TransactionStatus_new" AS ENUM ('INITIALIZED', 'COMPLETED', 'FAILED');
ALTER TABLE "transaction_entities" ALTER COLUMN "status" TYPE "TransactionStatus_new" USING ("status"::text::"TransactionStatus_new");
ALTER TYPE "TransactionStatus" RENAME TO "TransactionStatus_old";
ALTER TYPE "TransactionStatus_new" RENAME TO "TransactionStatus";
DROP TYPE "public"."TransactionStatus_old";
COMMIT;
