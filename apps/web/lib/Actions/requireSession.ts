"use server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

export async function requireSession(errorMessage = "You must be logged in.") {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return { session: null, error: errorMessage } as const
  }
  return { session, error: null } as const
}