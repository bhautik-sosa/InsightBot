import { prisma } from "./prisma";

export async function executeQuery(query: string) {
    try {
        const result = await prisma.$queryRawUnsafe(query);
        return result;
    } catch (error) {
        console.error("Error executing query:", error);
        return [];
    }
}