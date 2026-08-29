"use server"

import {prisma} from "@repo/db";
import { requireSession } from "./requireSession";

export async function getDomain() {

    try {

        const { session, error } = await requireSession("You must be logged in to see your api key.")
        if (error) return { error }



        const email = session?.user.email;

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
