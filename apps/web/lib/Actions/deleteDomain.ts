"use server"

import { prisma } from "@repo/db";
import { deleteCache } from "@repo/redis";
import { requireSession } from "./requireSession";

export async function deleteDomain(id: string) {
    try {
        const { session, error } = await requireSession("You must be logged in to see your api key.")
        if (error) return { error }

        if (!id || id.trim().length === 0) {
            return { error: "Domain ID cannot be empty." };
        }

        const domain = await prisma.domain.findFirst({
            where: {
                id,
                userId: session?.user.id,
            },
            select: { id: true, apikey: true }
        });

        if (!domain) {
            return { error: "Domain not found." };
        }

        await prisma.domain.delete({ where: { id } });

        // The database delete is authoritative; cache cleanup is best-effort.
        try {
            await deleteCache(`apikey:${domain.apikey}`);
        } catch (cacheError) {
            console.warn("Failed to invalidate deleted domain API key cache:", cacheError);
        }

        return { success: true };
    } catch (error) {
        console.error("Error deleting domain:", error);
        return { error: "An error occurred while deleting the domain." };
    }
}