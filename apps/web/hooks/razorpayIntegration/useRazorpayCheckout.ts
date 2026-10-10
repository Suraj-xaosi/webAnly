"use client"

import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useCreateOrder } from "./useCreateOrder"
import { useRazorpayScript } from "./userRazorpayScript"
import { getPaymentStatus } from "@/lib/Actions/getPaymmentStatus"
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys"
import type { Domain } from "@repo/types/domain"

export type CheckoutStatus =
  | "idle"
  | "creating-order"
  | "awaiting-payment"
  | "confirming"
  | "error"

const POLL_INTERVAL_MS = 2500
const POLL_TIMEOUT_MS = 20_000

export function useRazorpayCheckout() {
  const scriptStatus = useRazorpayScript()
  const scriptReady = scriptStatus === "ready"
  const createOrderMutation = useCreateOrder()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<CheckoutStatus>("idle")
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const pollForConfirmation = useCallback(
    (razorpayOrderId: string, domainId: string) => {
      setStatus("confirming")
      const startedAt = Date.now()

      const check = async () => {
        let result
        try {
          result = await getPaymentStatus(razorpayOrderId)
        } catch {
          setStatus("error")
          setActiveDomainId(domainId)
          setErrorMessage("We couldn't confirm the payment status. Please check again before retrying.")
          return
        }

        if (result.success && result.data.status === "SUCCESS") {
          await queryClient.invalidateQueries({ queryKey: queryKeys.domain() })
          setStatus("idle")
          setActiveDomainId(null)
          setErrorMessage(null)
          return
        }

        if (result.success && result.data.status === "FAILED") {
          setStatus("error")
          setActiveDomainId(domainId)
          setErrorMessage("The payment was not completed. You can try again.")
          return
        }

        if (!result.success) {
          setStatus("error")
          setActiveDomainId(domainId)
          setErrorMessage("We couldn't confirm the payment status. Please check again before retrying.")
          return
        }

        if (Date.now() - startedAt >= POLL_TIMEOUT_MS) {
          setStatus("error")
          setActiveDomainId(domainId)
          setErrorMessage("Payment is still awaiting confirmation. Check its status before trying again.")
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
        setActiveDomainId(domain.id)
        setErrorMessage(
          scriptStatus === "error"
            ? "Secure checkout couldn't load. Check your connection or browser extensions, then reload this page."
            : "Secure checkout is still loading. Please wait a moment and try again."
        )
        return
      }

      setStatus("creating-order")
      setActiveDomainId(domain.id)
      setErrorMessage(null)

      let order
      try {
        order = await createOrderMutation.mutateAsync(domain.id)
      } catch {
        setStatus("error")
        setActiveDomainId(domain.id)
        setErrorMessage("We couldn't create a payment order, so checkout didn't open. Please try again later.")
        return
      }

      setStatus("awaiting-payment")
      try {
        const razorpay = new window.Razorpay({
          key: order.keyId,
          order_id: order.razorpayOrderId,
          amount: order.amount,
          currency: "INR",
          name: "Webanly",
          description: "Domain premium payment",
          handler: () => {
            pollForConfirmation(order.razorpayOrderId, domain.id)
          },
          modal: {
            ondismiss: () => {
              setStatus("idle")
              setActiveDomainId(null)
              setErrorMessage(null)
            },
          },
        })

        razorpay.on("payment.failed", () => {
          setStatus("error")
          setActiveDomainId(domain.id)
          setErrorMessage("The payment provider couldn't complete the payment. Please try again.")
        })
        razorpay.open()
      } catch {
        setStatus("error")
        setActiveDomainId(domain.id)
        setErrorMessage("Secure checkout couldn't be opened. Please try again.")
      }
    },
    [scriptReady, scriptStatus, createOrderMutation, pollForConfirmation]
  )

  return {
    payForDomain,
    status,
    activeDomainId,
    scriptReady,
    scriptStatus,
    errorMessage,
  }
}