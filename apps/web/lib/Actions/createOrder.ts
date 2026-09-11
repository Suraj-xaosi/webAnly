"use server"

import { prisma, type PaymentPurpose } from "@repo/db"
import { requireSession } from "./requireSession"
import { getPricing } from "./getPricing"
import { razorpay } from "@/lib/razorPay"
import { env } from "@/lib/env/server"
import { actionErr, actionOk } from "@/lib/shared/types/actionResult"
import { findOwnedDomain } from "./findOwnedDomain"

// If a PENDING payment for this domain already exists and is younger than
// this, we reuse it instead of creating a second payable order. This is
// what stops a double-click (or a retried request) from producing two
// separate orders for the same domain — and doubles as simple rate
// limiting, since repeat clicks within the window never hit Razorpay again.
const EXISTING_PENDING_REUSE_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export async function createOrder(domainId: string) {
  try {
    if (!domainId || domainId.trim().length === 0) {
      return actionErr("Domain ID cannot be empty.")
    }

    const sessionResult = await requireSession("You must be logged in to buy or extend a domain.")
    if (!sessionResult.success) return actionErr(sessionResult.error)

    const domain = await findOwnedDomain(domainId, sessionResult.data.user.id, {
      id: true,
      state: true,
      endsAt: true,
    })

    if (!domain) {
      return actionErr("Domain not found.")
    }

    // Reuse a still-fresh PENDING payment for this domain if one exists,
    // rather than letting every click mint a brand new Razorpay order.
    const existingPending = await prisma.payment.findFirst({
      where: { domainId: domain.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    })

    if (existingPending) {
      const age = Date.now() - existingPending.createdAt.getTime()

      if (age < EXISTING_PENDING_REUSE_WINDOW_MS) {
        return actionOk({
          razorpayOrderId: existingPending.razorpayOrderId,
          amount: existingPending.amount,
          keyId: env.RAZORPAY_KEY_ID,
        })
      }

      // Old enough to be considered abandoned. Mark it FAILED so it can
      // never later resolve to SUCCESS and clash with the new order we're
      // about to create below.
      await prisma.payment.update({
        where: { id: existingPending.id },
        data: { status: "FAILED", failureReason: "Superseded by a new payment attempt." },
      })
    }

    // purpose is recorded for audit/history only — the webhook re-derives
    // the actual domain mutation from live state at settlement time, since
    // this snapshot can go stale if the domain's state changes before the
    // user actually pays.
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