"use server"

import { prisma } from "@repo/db"
import { requireSession } from "./requireSession"
import { actionErr, actionOk } from "@/lib/shared/types/actionResult"

export async function getPaymentStatus(razorpayOrderId: string) {
  try {
    if (!razorpayOrderId || razorpayOrderId.trim().length === 0) {
      return actionErr("Order ID cannot be empty.")
    }

    const sessionResult = await requireSession("You must be logged in to check payment status.")
    if (!sessionResult.success) return actionErr(sessionResult.error)

    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId, userId: sessionResult.data.user.id },
      select: { status: true },
    })

    if (!payment) {
      return actionErr("Payment not found.")
    }

    return actionOk({ status: payment.status })
  } catch (err) {
    console.error("getPaymentStatus error:", err)
    return actionErr("Something went wrong while checking payment status.")
  }
}