"use server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { actionErr, actionOk, type ActionResult } from "@/lib/shared/types/actionResult"

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>

export async function requireSession(
  errorMessage = "You must be logged in."
): Promise<ActionResult<Session>> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return actionErr(errorMessage)
  }
  return actionOk(session)
}