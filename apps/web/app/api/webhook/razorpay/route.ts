import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@repo/db"
import { env } from "@/lib/env/server"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export async function POST(req: NextRequest) {
  try {
    // Signature must be computed over the exact raw bytes Razorpay sent —
    // parsing to JSON first and re-stringifying would break the hash match.
    const rawBody = await req.text()
    const signature = req.headers.get("x-razorpay-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    const expectedSignature = crypto
      .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("hex")

    if (expectedSignature !== signature) {
      console.error("Razorpay webhook: signature mismatch")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const body = JSON.parse(rawBody)
    const event = body.event as string
    const paymentEntity = body.payload?.payment?.entity

    if (!paymentEntity?.order_id) {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 })
    }

    const razorpayOrderId = paymentEntity.order_id as string
    const razorpayPaymentId = paymentEntity.id as string

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
    })

    if (!payment) {
      console.error("Razorpay webhook: no matching Payment for order", razorpayOrderId)
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Idempotency guard — Razorpay may send the same webhook more than once.
    // Once this Payment is already resolved, never re-run the Domain mutation.
    if (payment.status !== "PENDING") {
      return NextResponse.json({ received: true })
    }

    if (event === "payment.captured") {
      await prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: "SUCCESS",
            razorpayPaymentId,
            razorpaySignature: signature,
          },
        })

        const domain = await tx.domain.findUnique({ where: { id: payment.domainId } })
        if (!domain) return

        // IMPORTANT: we deliberately do NOT branch on payment.purpose here.
        // purpose was decided at order-creation time, but a domain's real
        // state can change in the gap between "order created" and "webhook
        // arrives" — e.g. the domain lifecycle cron could deactivate it
        // while the user was sitting on the checkout screen. Branching on
        // stale intent could leave a paid domain stuck DEACTIVATED. Instead
        // we always re-check the domain's CURRENT state at the moment the
        // payment actually settles, and decide the mutation from that.
        if (domain.state === "DEACTIVATED") {
          await tx.domain.update({
            where: { id: domain.id },
            data: {
              type: "PAID",
              state: "ACTIVE",
              endsAt: new Date(Date.now() + THIRTY_DAYS_MS),
            },
          })
        } else {
          // Currently ACTIVE (FREE or PAID) → extend, adding 30 days on top
          // of whatever endsAt currently is.
          await tx.domain.update({
            where: { id: domain.id },
            data: {
              type: "PAID",
              endsAt: new Date(domain.endsAt.getTime() + THIRTY_DAYS_MS),
            },
          })
        }
      })
    } else if (event === "payment.failed") {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "FAILED",
          failureReason: paymentEntity.error_description ?? "Payment failed",
        },
      })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Razorpay webhook error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}