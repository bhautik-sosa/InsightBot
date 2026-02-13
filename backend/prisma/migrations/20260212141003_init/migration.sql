-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('INPROGRESS', 'ACTIVE', 'REJECTED', 'COMPLETE');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('INITIALIZED', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('EMIPAY', 'FULLPAY', 'PARTPAY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID');

-- CreateTable
CREATE TABLE "loan_transactions" (
    "id" SERIAL NOT NULL,
    "userId" UUID NOT NULL,
    "loanStatus" "LoanStatus" NOT NULL,
    "netApprovedAmount" DECIMAL(12,2),
    "loan_disbursement_date" TIMESTAMPTZ,
    "remark" VARCHAR(500),
    "userReasonDecline" VARCHAR(500),
    "bankingId" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banking_entities" (
    "id" SERIAL NOT NULL,
    "mandateBank" VARCHAR(50) NOT NULL,
    "disbursementBank" VARCHAR(50) NOT NULL,
    "salary" DECIMAL(12,2),
    "salaryDate" INTEGER,
    "salaryVerification" INTEGER NOT NULL,
    "salaryVerificationDate" TIMESTAMPTZ,
    "adminSalary" DECIMAL(12,2),
    "attempts" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "rejectReason" VARCHAR(500),
    "status" VARCHAR(50),
    "userId" UUID NOT NULL,
    "loanId" INTEGER NOT NULL,
    "consentMode" VARCHAR(50),
    "stmtStartDate" TIMESTAMPTZ,
    "stmtEndDate" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "banking_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_entities" (
    "id" SERIAL NOT NULL,
    "paidAmount" INTEGER NOT NULL,
    "status" "TransactionStatus" NOT NULL,
    "completionDate" TIMESTAMPTZ,
    "type" "TransactionType" NOT NULL,
    "paymentTime" TIMESTAMPTZ,
    "userId" UUID NOT NULL,
    "loanId" INTEGER NOT NULL,
    "emiId" INTEGER,
    "principalAmount" INTEGER NOT NULL,
    "interestAmount" INTEGER NOT NULL,
    "feesIncome" INTEGER NOT NULL,
    "subscriptionDate" TIMESTAMPTZ,
    "max_dpd" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "transaction_entities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emi_entities" (
    "id" SERIAL NOT NULL,
    "emi_date" TIMESTAMPTZ NOT NULL,
    "emiNumber" INTEGER NOT NULL,
    "payment_done_date" TIMESTAMPTZ,
    "paymentStatus" "PaymentStatus" NOT NULL,
    "loanId" INTEGER NOT NULL,
    "userId" UUID NOT NULL,
    "principalCovered" INTEGER NOT NULL,
    "interestCalculate" INTEGER NOT NULL,
    "pay_type" VARCHAR(50),
    "paid_principal" DECIMAL(12,2),
    "paid_interest" DECIMAL(12,2),
    "delayAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emi_entities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "loan_transactions_userId_idx" ON "loan_transactions"("userId");

-- CreateIndex
CREATE INDEX "loan_transactions_loanStatus_idx" ON "loan_transactions"("loanStatus");

-- CreateIndex
CREATE INDEX "loan_transactions_bankingId_idx" ON "loan_transactions"("bankingId");

-- CreateIndex
CREATE INDEX "loan_transactions_createdAt_idx" ON "loan_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "banking_entities_loanId_key" ON "banking_entities"("loanId");

-- CreateIndex
CREATE INDEX "banking_entities_userId_idx" ON "banking_entities"("userId");

-- CreateIndex
CREATE INDEX "banking_entities_loanId_idx" ON "banking_entities"("loanId");

-- CreateIndex
CREATE INDEX "banking_entities_mandateBank_idx" ON "banking_entities"("mandateBank");

-- CreateIndex
CREATE INDEX "banking_entities_adminId_idx" ON "banking_entities"("adminId");

-- CreateIndex
CREATE INDEX "banking_entities_createdAt_idx" ON "banking_entities"("createdAt");

-- CreateIndex
CREATE INDEX "transaction_entities_userId_idx" ON "transaction_entities"("userId");

-- CreateIndex
CREATE INDEX "transaction_entities_loanId_idx" ON "transaction_entities"("loanId");

-- CreateIndex
CREATE INDEX "transaction_entities_emiId_idx" ON "transaction_entities"("emiId");

-- CreateIndex
CREATE INDEX "transaction_entities_status_idx" ON "transaction_entities"("status");

-- CreateIndex
CREATE INDEX "transaction_entities_type_idx" ON "transaction_entities"("type");

-- CreateIndex
CREATE INDEX "transaction_entities_createdAt_idx" ON "transaction_entities"("createdAt");

-- CreateIndex
CREATE INDEX "transaction_entities_completionDate_idx" ON "transaction_entities"("completionDate");

-- CreateIndex
CREATE INDEX "emi_entities_userId_idx" ON "emi_entities"("userId");

-- CreateIndex
CREATE INDEX "emi_entities_loanId_idx" ON "emi_entities"("loanId");

-- CreateIndex
CREATE INDEX "emi_entities_emi_date_idx" ON "emi_entities"("emi_date");

-- CreateIndex
CREATE INDEX "emi_entities_paymentStatus_idx" ON "emi_entities"("paymentStatus");

-- CreateIndex
CREATE INDEX "emi_entities_createdAt_idx" ON "emi_entities"("createdAt");

-- AddForeignKey
ALTER TABLE "banking_entities" ADD CONSTRAINT "banking_entities_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loan_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_entities" ADD CONSTRAINT "transaction_entities_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loan_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_entities" ADD CONSTRAINT "transaction_entities_emiId_fkey" FOREIGN KEY ("emiId") REFERENCES "emi_entities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emi_entities" ADD CONSTRAINT "emi_entities_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loan_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
