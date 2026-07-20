//web/lib/Actions/getDomain.ts
"use server"
import { auth } from "@/lib/auth"; // Your Better Auth server instance
import { headers } from "next/headers";
import {prisma} from "@repo/db";

export async function getDomain() {

    try {

        const session = await auth.api.getSession({
            headers: await headers() // Pass headers to extract the session cookie
        });

        if (!session) {
         // User is not logged in
            return { error: "You must be logged in to see your domain." };
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

        return { domains: user.domains };

    } 
    catch (err: any) {
        console.error(" getting DOMAIN ERROR:", err);

        return { error: "Something went wrong while getting domain." };
    }


    
}
