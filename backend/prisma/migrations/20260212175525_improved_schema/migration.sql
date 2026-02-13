/*
  Warnings:

  - The `consentMode` column on the `banking_entities` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `pay_type` on the `emi_entities` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PayType" AS ENUM ('EMIPAY', 'FULLPAY');

-- CreateEnum
CREATE TYPE "ConsentMode" AS ENUM ('CAMS', 'BANKINGPRO', 'IGNOSIS');

-- AlterTable
ALTER TABLE "banking_entities" DROP COLUMN "consentMode",
ADD COLUMN     "consentMode" "ConsentMode";

-- AlterTable
ALTER TABLE "emi_entities" DROP COLUMN "pay_type",
ADD COLUMN     "payType" "PayType";
