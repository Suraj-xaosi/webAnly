//web/lib/Actions/setDomain.ts
"use server";
import { auth } from "@/lib/auth"; // Your Better Auth server instance
import { headers } from "next/headers";
import {prisma} from "@repo/db";

export async function setDomain(domainName: string, expectedVisitors: number) {
    try {

        const session = await auth.api.getSession({
            headers: await headers() // Pass headers to extract the session cookie
        });

        if (!session) {
         // User is not logged in
            return { error: "You must be logged in to add a domain." };
        }

    

        if (!domainName || domainName.trim().length === 0) {
            return { error: "Domain cannot be empty." };
        }
        domainName = domainName.trim().toLowerCase();

        if(!expectedVisitors || isNaN(expectedVisitors)) {
            expectedVisitors = 100; // Default value if not provided or invalid
        }
        
        if (expectedVisitors <= 0) {
            expectedVisitors = 100; // Default value if not provided or invalid
        }


        const email = session.user.email;

        // 2. Fetch user along with sites
        const user = await prisma.user.findUnique({
          where:   { email },
          include: { domains: true },
        });

        if (!user) {
          return { error: "User not found." };
        }

        // 3. Check limit: only 2 allowed
        if (user.domains.length >= 2) {
          return { error: "You can only add 2 domains." };
        }

        // 4. Check if domain already exists globally (your schema has unique domain)
        const existing = await prisma.domain.findUnique({
          where: { domainName: domainName },
        });

        if (existing) {
          return { error: "This domain is already in use." };
        }

    // 5. Create new domain
        await prisma.domain.create({
            data: {
                domainName: domainName,
                userId: user.id,
                apikey: crypto.randomUUID(), // Generate a unique API key
                isActive: true,
                expectedVisitors: expectedVisitors, // Use the provided value
            },
        });

        return { success: true };
    } 
    catch (err: any) {
        console.error("ADD DOMAIN ERROR:", err);

        // Prisma unique constraint error
        if (err.code === "P2002") {
            return { error: "Domain already exists." };
        }

        return { error: "Something went wrong while adding domain." };
    }


    
}
