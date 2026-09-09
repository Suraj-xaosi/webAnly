"use server"

import { prisma } from "@repo/db"
import { actionErr, actionOk } from "@/lib/shared/types/actionResult"

// Fallback used only if the PricingConfig singleton row hasn't been seeded yet.
// INR paise — 4000 = ₹40. Keep in sync with the intended default price.
const DEFAULT_PAID_DOMAIN_PRICE = 4000

export async function getPricing() {
  try {
    const config = await prisma.pricingConfig.findUnique({
      where: { id: "default" },
    })

    return actionOk({
      paidDomainPrice: config?.paidDomainPrice ?? DEFAULT_PAID_DOMAIN_PRICE,
    })
  } catch (err) {
    console.error("getPricing error:", err)
    return actionErr("Something went wrong while getting pricing.")
  }
}