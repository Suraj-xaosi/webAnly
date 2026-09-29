"use client"

import { useSyncExternalStore } from "react"

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js"

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
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => RazorpayCheckout
  }
}

// Loads Razorpay's checkout widget script exactly once, even if this hook
// is used by multiple components on the same page. Returns true once
// window.Razorpay is available and the checkout popup can be opened.
export function useRazorpayScript() {
  return useSyncExternalStore(
    subscribeToRazorpay,
    getRazorpaySnapshot,
    getServerRazorpaySnapshot
  )
}

function getRazorpaySnapshot() {
  return typeof window !== "undefined" && !!window.Razorpay
}

function getServerRazorpaySnapshot() {
  return false
}

function subscribeToRazorpay(onStoreChange: () => void) {
  if (typeof window === "undefined" || window.Razorpay) return () => {}

  let script = document.querySelector<HTMLScriptElement>(
    `script[src="${SCRIPT_SRC}"]`
  )
  const shouldAppend = !script

  if (!script) {
    script = document.createElement("script")
    script.src = SCRIPT_SRC
    script.async = true
  }

  const handleLoad = () => onStoreChange()
  const handleError = () => {
    console.error("Failed to load Razorpay checkout script.")
    onStoreChange()
  }

  script.addEventListener("load", handleLoad)
  script.addEventListener("error", handleError)
  if (shouldAppend) document.body.appendChild(script)

  return () => {
    script?.removeEventListener("load", handleLoad)
    script?.removeEventListener("error", handleError)
  }
}
