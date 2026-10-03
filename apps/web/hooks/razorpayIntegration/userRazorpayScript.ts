"use client"

import { useSyncExternalStore } from "react"

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js"
export type RazorpayScriptStatus = "loading" | "ready" | "error"

let scriptStatus: RazorpayScriptStatus = "loading"
let scriptElement: HTMLScriptElement | null = null
const listeners = new Set<() => void>()

interface RazorpayCheckoutOptions {
  key: string
  order_id: string
  amount: number
  currency: string
  name: string
  description: string
  handler: () => void
  modal: {
    ondismiss: () => void
  }
}

interface RazorpayCheckout {
  open: () => void
  on: (event: "payment.failed", handler: () => void) => void
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayCheckout
  }
}

export function useRazorpayScript() {
  return useSyncExternalStore(
    subscribeToRazorpay,
    getRazorpaySnapshot,
    getServerRazorpaySnapshot
  )
}

function getRazorpaySnapshot(): RazorpayScriptStatus {
  if (typeof window !== "undefined" && window.Razorpay) return "ready"
  return scriptStatus
}

function getServerRazorpaySnapshot(): RazorpayScriptStatus {
  return "loading"
}

function subscribeToRazorpay(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  if (typeof window === "undefined" || window.Razorpay || scriptElement) {
    return () => listeners.delete(onStoreChange)
  }

  scriptElement = document.querySelector<HTMLScriptElement>(
    `script[src="${SCRIPT_SRC}"]`
  )
  if (!scriptElement) {
    scriptElement = document.createElement("script")
    scriptElement.src = SCRIPT_SRC
    scriptElement.async = true
  }

  const notify = () => listeners.forEach((listener) => listener())
  const handleLoad = () => {
    scriptStatus = window.Razorpay ? "ready" : "error"
    notify()
  }
  const handleError = () => {
    console.error("Failed to load Razorpay checkout script.")
    scriptStatus = "error"
    notify()
  }

  scriptElement.addEventListener("load", handleLoad, { once: true })
  scriptElement.addEventListener("error", handleError, { once: true })
  if (!scriptElement.isConnected) document.body.appendChild(scriptElement)

  return () => {
    listeners.delete(onStoreChange)
  }
}
