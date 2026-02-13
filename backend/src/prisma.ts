import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'

dotenv.config()

const connectionString = `${process.env.DATABASE_URL}`
const adapter = new PrismaPg({ connectionString })
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

if (!process.env.DATABASE_URL) {
    throw new Error("Missing DATABASE_URL in environment");
}

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
