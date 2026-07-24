//web/lib/Actions/setDomain.ts
"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@repo/db"
import { headers } from "next/headers"

const DOMAIN_PATTERN = /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i

function isValidDomain(value: string) {
  return DOMAIN_PATTERN.test(value)
}

export async function setDomain(domainName: string, expectedVisitors: number, defaultTimezone: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    })

    if (!session) {
      return { error: "You must be logged in to add a domain." }
    }

    const sanitizedDomain = domainName?.trim().toLowerCase() ?? ""
    if (!sanitizedDomain || !isValidDomain(sanitizedDomain)) {
      return { error: "Enter a valid domain name, such as example.com." }
    }

    const safeExpectedVisitors = Number.isFinite(expectedVisitors) && expectedVisitors > 0 ? Math.floor(expectedVisitors) : 100
    const safeTimezone = defaultTimezone?.trim() || "UTC"

    const email = session.user.email

    const user = await prisma.user.findUnique({
      where: { email },
      include: { domains: true },
    })

    if (!user) {
      return { error: "User not found." }
    }

    if (user.domains.length >= 2) {
      return { error: "You can only add 2 domains." }
    }

    const existing = await prisma.domain.findUnique({
      where: { domainName: sanitizedDomain },
    })

    if (existing) {
      return { error: "This domain is already in use." }
    }

    const threeDigitUid = Math.floor(Math.random() * 900 + 100).toString()

    await prisma.domain.create({
      data: {
        domainName: `fun${sanitizedDomain}${threeDigitUid}`,
        userId: user.id,
        apikey: crypto.randomUUID(),
        isActive: true,
        expectedVisitors: safeExpectedVisitors,
        defaultTimezone: safeTimezone,
      },
    })

    return { success: true }
  } catch (err: any) {
    console.error("ADD DOMAIN ERROR:", err)

    if (err.code === "P2002") {
      return { error: "Domain already exists." }
    }

    return { error: "Something went wrong while adding domain." }
  }
}
