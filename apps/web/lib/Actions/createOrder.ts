"use server"

import { prisma, type PaymentPurpose } from "@repo/db"
import { requireSession } from "./requireSession"
import { getPricing } from "./getPricing"
import { razorpay } from "@/lib/razorPay"
import { env } from "@/lib/env/server"
import { actionErr, actionOk } from "@/lib/shared/types/actionResult"

export async function createOrder(domainId: string) {
  try {
    if (!domainId || domainId.trim().length === 0) {
      return actionErr("Domain ID cannot be empty.")
    }

    const sessionResult = await requireSession("You must be logged in to buy or extend a domain.")
    if (!sessionResult.success) return actionErr(sessionResult.error)

    const domain = await prisma.domain.findFirst({
      where: { id: domainId, userId: sessionResult.data.user.id },
      select: { id: true, state: true, endsAt: true },
    })

    if (!domain) {
      return actionErr("Domain not found.")
    }

    // DEACTIVATED domains (expired FREE or expired PAID) → reactivate with a fresh 30-day period.
    // ACTIVE domains (FREE or PAID) → extend, adding 30 days on top of current endsAt.
    const purpose: PaymentPurpose = domain.state === "DEACTIVATED" ? "REACTIVATE" : "EXTEND"

    const pricingResult = await getPricing()
    if (!pricingResult.success) return actionErr(pricingResult.error)
    const amount = pricingResult.data.paidDomainPrice

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `dom_${domainId}_${Date.now()}`,
    })

    await prisma.payment.create({
      data: {
        userId: sessionResult.data.user.id,
        domainId: domain.id,
        purpose,
        amount,
        razorpayOrderId: order.id,
        status: "PENDING",
      },
    })

    return actionOk({
      razorpayOrderId: order.id,
      amount,
      keyId: env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error("createOrder error:", err)
    return actionErr("Something went wrong while creating the payment order.")
  }
}