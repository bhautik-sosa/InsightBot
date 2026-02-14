import { Prisma } from "@prisma/client";
import xlsx from "xlsx";
import { prisma } from "../prisma";

async function importLoanWorkbook(filePath: string) {
    const workbook = xlsx.readFile(filePath);

    const getSheetData = (sheetName: string) => {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) throw new Error(`Sheet ${sheetName} not found`);
        return xlsx.utils.sheet_to_json(sheet, { defval: null });
    };

    // 🧠 ORDER MATTERS (foreign keys)
    const sheetConfig = [
        {
            name: "LoanTransactions",
            model: "loanTransaction",
            transform: (row: any) => ({
                id: Number(row.id),
                userId: row.userId,
                loanStatus: row.loanStatus,
                netApprovedAmount: row.netApprovedAmount
                    ? new Prisma.Decimal(row.netApprovedAmount)
                    : null,
                loanDisbursementDate: row.loan_disbursement_date
                    ? new Date(row.loan_disbursement_date)
                    : null,
                remark: row.remark,
                userReasonDecline: row.userReasonDecline,
                bankingId: row.bankingId ? Number(row.bankingId) : null,
                createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
            }),
        },
        {
            name: "BankingEntities",
            model: "bankingEntity",
            transform: (row: any) => ({
                id: Number(row.id),
                mandateBank: row.mandateBank,
                disbursementBank: row.disbursementBank,
                salary: row.salary ? new Prisma.Decimal(row.salary) : null,
                salaryDate: row.salaryDate,
                salaryVerification: Number(row.salaryVerification),
                salaryVerificationDate: row.salaryVerificationDate
                    ? new Date(row.salaryVerificationDate)
                    : null,
                adminSalary: row.adminSalary
                    ? new Prisma.Decimal(row.adminSalary)
                    : null,
                attempts: Number(row.attempts),
                adminId: Number(row.adminId),
                rejectReason: row.rejectReason,
                status: row.status,
                userId: row.userId,
                loanId: Number(row.loanId),
                consentMode: row.consentMode,
                stmtStartDate: row.stmtStartDate
                    ? new Date(row.stmtStartDate)
                    : null,
                stmtEndDate: row.stmtEndDate
                    ? new Date(row.stmtEndDate)
                    : null,
                createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
                updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
            }),
        },
        {
            name: "EmiEntities",
            model: "emiEntity",
            transform: (row: any) => ({
                id: Number(row.id),
                emiDate: new Date(row.emi_date),
                emiNumber: Number(row.emiNumber),
                paymentDoneDate: row.payment_done_date
                    ? new Date(row.payment_done_date)
                    : null,
                paymentStatus: row.payment_status,
                loanId: Number(row.loanId),
                userId: row.userId,
                principalCovered: Number(row.principalCovered) || 0,
                interestCalculate: Number(row.interestCalculate) || 0,
                payType: row.payType,
                paidPrincipal: row.paid_principal
                    ? new Prisma.Decimal(row.paid_principal)
                    : null,
                paidInterest: row.paid_interest
                    ? new Prisma.Decimal(row.paid_interest)
                    : null,
                delayAmount: new Prisma.Decimal(row.delayAmount),
                createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
            }),
        },
        {
            name: "TransactionEntities",
            model: "transactionEntity",
            transform: (row: any) => ({
                id: Number(row.id),
                paidAmount: Number(row.paidAmount) || 0,
                status: row.status,
                completionDate: row.completionDate
                    ? new Date(row.completionDate)
                    : null,
                type: row.type,
                paymentTime: row.paymentTime
                    ? new Date(row.paymentTime)
                    : null,
                userId: row.userId,
                loanId: Number(row.loanId),
                emiId: row.emiId ? Number(row.emiId) : null,
                principalAmount: Number(row.principalAmount) || 0,
                interestAmount: Number(row.interestAmount) || 0,
                feesIncome: Number(row.feesIncome) || 0,
                subscriptionDate: row.subscriptionDate
                    ? new Date(row.subscriptionDate)
                    : null,
                maxDPD: Number(row.max_dpd) || 0,
                createdAt: row.createdAt ? new Date(row.createdAt) : undefined,
                updatedAt: row.updatedAt ? new Date(row.updatedAt) : undefined,
            }),
        },
    ];

    try {
        await prisma.$transaction(async (tx) => {
            for (const sheet of sheetConfig) {
                const rows = getSheetData(sheet.name);

                console.log(`📄 Processing ${sheet.name} (${rows.length} rows)`);

                for (const row of rows) {
                    await (tx as any)[sheet.model].create({
                        data: sheet.transform(row),
                    });
                }

                console.log(`✅ ${sheet.name} inserted`);
            }
        });

        console.log("🎉 ALL SHEETS MIGRATED SUCCESSFULLY");
    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

importLoanWorkbook("./Sample_Data.xlsx")