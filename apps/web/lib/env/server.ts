import "server-only"

// Centralized read of every server-only (non-NEXT_PUBLIC_) env var.
// The "server-only" import above is the actual protection: if this file
// ever gets pulled into a client bundle, the build fails loudly. This is
// If a value here is ever undefined/wrong at runtime, this is the one file
// to check first — every entry below lists exactly which file(s) use it.

export const env = {
  // apps/web/lib/auth.ts — GitHub OAuth provider config
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID as string,
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET as string,

  // apps/web/lib/razorpay.ts — Razorpay SDK client instantiation
  // apps/web/lib/Actions/createOrder.ts — returned to the frontend as the
  // public `keyId` (safe to expose; it's the public half of the key pair)
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID as string,

  // apps/web/lib/razorpay.ts — Razorpay SDK client instantiation
  // Never returned to the frontend — this is the actual secret half.
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET as string,

  // apps/web/app/api/webhooks/razorpay/route.ts — HMAC signature
  // verification on incoming webhook payloads
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET as string,
}