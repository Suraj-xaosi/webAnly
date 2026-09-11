"use server"

import { requireSession } from "./requireSession";
import { findOwnedDomain } from "./findOwnedDomain";
import { actionErr, actionOk } from "@/lib/shared/types/actionResult"

export async function getApikey(domainId: string) {
  try {
    if (!domainId || domainId.trim().length === 0) {
      return actionErr("Domain ID cannot be empty.")
    }

    const sessionResult = await requireSession("You must be logged in to see your api key.")
    if (!sessionResult.success) return actionErr(sessionResult.error)

    const domain = await findOwnedDomain(domainId, sessionResult.data.user.id, { apikey: true });

    if (!domain) {
      return actionErr("Domain not found.")
    }

    return actionOk(domain.apikey)
  } catch (err) {
    console.error("getApikey error:", err);
    return actionErr("Something went wrong while getting the api key.")
  }
}