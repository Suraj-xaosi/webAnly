import { NextRequest, NextResponse } from "next/server"
import crypto from "node:crypto"
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

    if (event !== "payment.captured" && event !== "payment.failed") {
      return NextResponse.json({ received: true })
    }

    const paymentEntity = body.payload?.payment?.entity

    if (
      typeof paymentEntity?.order_id !== "string" ||
      typeof paymentEntity?.id !== "string"
    ) {
      return NextResponse.json({ error: "Malformed payload" }, { status: 400 })
    }

    const razorpayOrderId = paymentEntity.order_id
    const razorpayPaymentId = paymentEntity.id

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId },
    })

    if (!payment) {
      console.error(
        "Razorpay webhook: no matching Payment for order",
        razorpayOrderId
      )
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    if (event === "payment.captured") {
      if (
        paymentEntity.amount !== payment.amount ||
        paymentEntity.currency !== "INR"
      ) {
        console.error(
          "Razorpay webhook: captured amount/currency mismatch",
          razorpayOrderId
        )
        return NextResponse.json(
          { error: "Payment amount or currency mismatch" },
          { status: 400 }
        )
      }

      await prisma.$transaction(async (tx) => {
        // Serialize separate successful orders for the same domain so one
        // extension cannot overwrite another's endsAt update.
        const domains = await tx.$queryRaw<
          {
            id: string
            state: "ACTIVE" | "DEACTIVATED"
            endsAt: Date
          }[]
        >`SELECT "id", "state", "endsAt"
          FROM "domain"
          WHERE "id" = ${payment.domainId}
          FOR UPDATE`
        const domain = domains[0]

        if (!domain) return

        // This conditional transition is the idempotency gate: only one
        // delivery can move this payment from PENDING to SUCCESS.
        const claimed = await tx.payment.updateMany({
          where: { id: payment.id, status: "PENDING" },
          data: {
            status: "SUCCESS",
            pendingDomainId: null,
            razorpayPaymentId,
            razorpaySignature: signature,
            failureReason: null,
          },
        })

        if (claimed.count !== 1) {
          return
        }

        // Re-check live state when money settles. The expiry job may not yet
        // have changed state even though endsAt is already in the past.
        const now = new Date()
        const startsFromNow =
          domain.state === "DEACTIVATED" ||
          domain.endsAt.getTime() <= now.getTime()

        await tx.domain.update({
          where: { id: domain.id },
          data: {
            type: "PAID",
            state: "ACTIVE",
            endsAt: new Date(
              (startsFromNow ? now.getTime() : domain.endsAt.getTime()) +
                THIRTY_DAYS_MS
            ),
          },
        })
      })
    } else if (event === "payment.failed") {
      // This event means one payment attempt failed, not necessarily that
      // the order can never succeed; another attempt may still be captured.
      await prisma.payment.updateMany({
        where: { id: payment.id, status: "PENDING" },
        data: {
          failureReason:
            typeof paymentEntity.error_description === "string"
              ? paymentEntity.error_description
              : "Payment attempt failed",
        },
      })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Razorpay webhook error:", err)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
