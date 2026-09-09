import Razorpay from "razorpay"
import { env } from "./env/server"

// Single shared Razorpay client instance.
// Reused by createOrder.ts (order creation) and later the webhook handler.

export const razorpay = new Razorpay({
  key_id: env.RAZORPAY_KEY_ID,
  key_secret: env.RAZORPAY_KEY_SECRET,
})