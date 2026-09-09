"use server"

import { prisma } from "@repo/db"
import { requireSession } from "./requireSession"
import { actionErr, actionOk } from "@/lib/shared/types/actionResult"

const DOMAIN_PATTERN = /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i

const FREE_TRIAL_DAYS = 10

function isValidDomain(value: string) {
  return DOMAIN_PATTERN.test(value)
}

export async function setDomain(domainName: string, expectedVisitors: number, defaultTimezone: string) {
  try {
    const sessionResult = await requireSession("You must be logged in to add a domain.")
    if (!sessionResult.success) return actionErr(sessionResult.error)

    const sanitizedDomain = domainName?.trim().toLowerCase() ?? ""
    if (!sanitizedDomain || !isValidDomain(sanitizedDomain)) {
      return actionErr("Enter a valid domain name, such as example.com.")
    }

    const safeExpectedVisitors = Number.isFinite(expectedVisitors) && expectedVisitors > 0 ? Math.floor(expectedVisitors) : 100
    const safeTimezone = defaultTimezone?.trim() || "UTC"
    const email = sessionResult.data.user.email

    const user = await prisma.user.findUnique({
      where: { email },
      include: { domains: true },
    })

    if (!user) {
      return actionErr("User not found.")
    }

    if (user.domains.length >= 2) {
      return actionErr("You can only add 2 domains.")
    }

    const existing = await prisma.domain.findUnique({ where: { domainName: sanitizedDomain } })
    if (existing) {
      return actionErr("This domain is already in use.")
    }

    const threeDigitUid = Math.floor(Math.random() * 900 + 100).toString()

    // New domains start as FREE + ACTIVE for a 10-day trial window.
    // type/state have schema defaults, but set explicitly here for clarity.
    const endsAt = new Date(Date.now() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000)

    const domain = await prisma.domain.create({
      data: {
        domainName: `fun${sanitizedDomain}${threeDigitUid}`,
        userId: user.id,
        apikey: crypto.randomUUID(),
        type: "FREE",
        state: "ACTIVE",
        endsAt,
        expectedVisitors: safeExpectedVisitors,
        defaultTimezone: safeTimezone,
      },
    })

    return actionOk(domain)
  } catch (err: any) {
    console.error("ADD DOMAIN ERROR:", err)
    if (err.code === "P2002") {
      return actionErr("Domain already exists.")
    }
    return actionErr("Something went wrong while adding domain.")
  }
}