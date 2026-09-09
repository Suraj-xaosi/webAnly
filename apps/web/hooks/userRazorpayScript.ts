"use client"

import { useEffect, useState } from "react"

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js"

declare global {
  interface Window {
    Razorpay: any
  }
}

// Loads Razorpay's checkout widget script exactly once, even if this hook
// is used by multiple components on the same page. Returns true once
// window.Razorpay is available and the checkout popup can be opened.
export function useRazorpayScript() {
  const [isReady, setIsReady] = useState(
    typeof window !== "undefined" && !!window.Razorpay
  )

  useEffect(() => {
    if (isReady || typeof window === "undefined") return

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`
    )

    if (existing) {
      if (window.Razorpay) {
        setIsReady(true)
      } else {
        existing.addEventListener("load", () => setIsReady(true))
      }
      return
    }

    const script = document.createElement("script")
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => setIsReady(true)
    document.body.appendChild(script)
  }, [isReady])

  return isReady
}