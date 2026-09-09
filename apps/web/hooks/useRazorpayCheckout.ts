"use client"

import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useCreateOrder } from "./useCreateOrder"
import { useRazorpayScript } from "./userRazorpayScript"
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

  // After the Razorpay popup reports success in the browser, we do NOT trust
  // that alone — only the server-side webhook actually updates the Domain
  // row once it verifies the payment. So instead of flipping the UI to
  // "success" immediately, we quietly re-check the domain list every couple
  // seconds until we see it change (comparing updatedAt, which the webhook
  // touches no matter which purpose branch it took).
  const pollForConfirmation = useCallback(
    (domainId: string, updatedAtBeforePayment: string) => {
      setStatus("confirming")
      const startedAt = Date.now()

      const check = async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.domain() })
        const domains = queryClient.getQueryData<Domain[]>(queryKeys.domain())
        const domain = domains?.find((d) => d.id === domainId)

        const hasUpdated =
          domain && String(domain.updatedAt) !== updatedAtBeforePayment

        if (hasUpdated) {
          setStatus("idle")
          setActiveDomainId(null)
          return
        }

        if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
          // Give up quietly rather than showing an error — the payment may
          // still be legitimately processing on Razorpay's/webhook's side.
          // The badge will pick up the change whenever the user next
          // refetches (e.g. navigating back to this page).
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
      const updatedAtBeforePayment = String(domain.updatedAt)

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
            // Browser-side callback only — this fires the moment Razorpay's
            // popup thinks payment succeeded, but it is not proof. Real
            // confirmation comes from the webhook, so we just start polling.
            pollForConfirmation(domain.id, updatedAtBeforePayment)
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