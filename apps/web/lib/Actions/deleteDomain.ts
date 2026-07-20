//web/lib/Actions/deleteDomain.ts
"use server"
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@repo/db";

export async function deleteDomain(id: string) {
    try {
        
        const session = await auth.api.getSession({
            headers: await headers()
        });

        if (!session) {
            return { error: "You must be logged in to delete a domain." };
        }

        if (!id || id.trim().length === 0) {
            return { error: "Domain ID cannot be empty." };
        }

        
        const domain = await prisma.domain.findUnique({
            where: { id },
            select: { userId: true }
        });

        if (!domain) {
            return { error: "Domain not found." };
        }

        if (domain.userId !== session.user.id) {
            return { error: "Unauthorized to delete this domain." };
        }

        await prisma.domain.delete({ where: { id } });
        return { success: true };
    } catch (error) {
        console.error("Error deleting domain:", error);
        return { error: "An error occurred while deleting the domain." };
    }
}