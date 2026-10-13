"use server"

import { prisma, type PaymentPurpose } from "@repo/db"
import { requireSession } from "./requireSession"
import { getPricing } from "./getPricing"
import { razorpay } from "@/lib/razorpayIntegration/razorPay"
import { env } from "@/lib/env/server"
import { actionErr, actionOk } from "@repo/types/actionResult"
import { findOwnedDomain } from "./findOwnedDomain"

export async function createOrder(domainId: string) {
  try {
    if (!domainId || domainId.trim().length === 0) {
      return actionErr("Domain ID cannot be empty.")
    }

    const sessionResult = await requireSession(
      "You must be logged in to buy or extend a domain."
    )
    if (!sessionResult.success) return actionErr(sessionResult.error)

    const domain = await findOwnedDomain(domainId, sessionResult.data.user.id, {
      id: true,
      state: true,
      endsAt: true,
    })

    if (!domain) {
      return actionErr("Domain not found.")
    }

    // Reuse the pending order regardless of age. An old order may still be
    // payable, so marking it failed based only on its age could discard a
    // later captured payment.
    const existingPending = await prisma.payment.findFirst({
      where: { domainId: domain.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    })

    if (existingPending) {
      return actionOk({
        razorpayOrderId: existingPending.razorpayOrderId,
        amount: existingPending.amount,
        keyId: env.RAZORPAY_KEY_ID,
      })
    }

    // purpose is recorded for audit/history only — the webhook re-derives
    // the actual domain mutation from live state at settlement time, since
    // this snapshot can go stale if the domain's state changes before the
    // user actually pays.
    const pricingResult = await getPricing()
    if (!pricingResult.success) return actionErr(pricingResult.error)
    const amount = pricingResult.data.paidDomainPrice

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `dom_${domainId}_${Date.now()}`,
    })

    const pendingPayment = await prisma.$transaction(async (tx) => {
      // Recheck ownership and deletion while holding the same row lock used
      // by domain deletion. This closes the lookup-to-order creation race.
      const domains = await tx.$queryRaw<
        { id: string; state: "ACTIVE" | "DEACTIVATED" }[]
      >`SELECT "id", "state"
        FROM "domain"
        WHERE "id" = ${domain.id}
          AND "userId" = ${sessionResult.data.user.id}
        FOR UPDATE`
      const lockedDomain = domains[0]

      if (!lockedDomain) return null

      const existing = await tx.payment.findFirst({
        where: { domainId: domain.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
      })
      if (existing) return existing

      const purpose: PaymentPurpose =
        lockedDomain.state === "DEACTIVATED" ? "REACTIVATE" : "EXTEND"

      return tx.payment.create({
        data: {
          userId: sessionResult.data.user.id,
          domainId: domain.id,
          pendingDomainId: domain.id,
          purpose,
          amount,
          razorpayOrderId: order.id,
          status: "PENDING",
        },
      })
    })

    if (!pendingPayment) {
      return actionErr("Domain not found or no longer available.")
    }

    return actionOk({
      razorpayOrderId: pendingPayment.razorpayOrderId,
      amount: pendingPayment.amount,
      keyId: env.RAZORPAY_KEY_ID,
    })
  } catch (err) {
    console.error("createOrder error:", err)
    return actionErr("Something went wrong while creating the payment order.")
  }
}
