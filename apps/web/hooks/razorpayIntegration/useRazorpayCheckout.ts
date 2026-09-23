"use client"

import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useCreateOrder } from "./useCreateOrder"
import { useRazorpayScript } from "./userRazorpayScript"
import { getPaymentStatus } from "@/lib/Actions/getPaymmentStatus"
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys"
import type { Domain } from "@/lib/shared/types/domain"

export type CheckoutStatus =
  | "idle"
  | "creating-order"
  | "awaiting-payment"
  | "confirming"
  | "error"

const POLL_INTERVAL_MS = 2500
const POLL_TIMEOUT_MS = 20_000

export function useRazorpayCheckout() {
  const scriptReady = useRazorpayScript()
  const createOrderMutation = useCreateOrder()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<CheckoutStatus>("idle")
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null)

  const pollForConfirmation = useCallback(
    (razorpayOrderId: string) => {
      setStatus("confirming")
      const startedAt = Date.now()

      const check = async () => {
        const result = await getPaymentStatus(razorpayOrderId)

        if (result.success && result.data.status === "SUCCESS") {
          await queryClient.invalidateQueries({ queryKey: queryKeys.domain() })
          setStatus("idle")
          setActiveDomainId(null)
          return
        }

        if (result.success && result.data.status === "FAILED") {
          setStatus("error")
          setActiveDomainId(null)
          return
        }

        // still PENDING (or lookup failed) — keep polling until timeout
        if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
          setStatus("idle")
          setActiveDomainId(null)
          return
        }

        setTimeout(check, POLL_INTERVAL_MS)
      }

      check()
    },
    [queryClient]
  )

  const payForDomain = useCallback(
    async (domain: Domain) => {
      if (!scriptReady) {
        setStatus("error")
        return
      }

      setStatus("creating-order")
      setActiveDomainId(domain.id)

      try {
        const order = await createOrderMutation.mutateAsync(domain.id)

        setStatus("awaiting-payment")

        const razorpay = new window.Razorpay({
          key: order.keyId,
          order_id: order.razorpayOrderId,
          amount: order.amount,
          currency: "INR",
          name: "Webanly",
          description: "Domain premium payment",
          handler: () => {
            pollForConfirmation(order.razorpayOrderId)
          },
          modal: {
            ondismiss: () => {
              setStatus("idle")
              setActiveDomainId(null)
            },
          },
        })

        razorpay.open()
      } catch {
        setStatus("error")
        setActiveDomainId(null)
      }
    },
    [scriptReady, createOrderMutation, pollForConfirmation]
  )

  return {
    payForDomain,
    status,
    activeDomainId,
    scriptReady,
  }
}