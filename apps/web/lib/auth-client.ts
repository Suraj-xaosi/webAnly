import { createAuthClient } from "better-auth/react"
import { publicEnv } from "./env/client"


export const authClient:any = createAuthClient({
    /** The base URL of the server (optional if you're using the same domain) */
    baseURL: publicEnv.NEXT_PUBLIC_BETTER_AUTH_BASE_URL
})