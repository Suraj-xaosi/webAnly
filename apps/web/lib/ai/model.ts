import "server-only"
import { ChatGroq } from "@langchain/groq"
import { env } from "@/lib/env/server"

// Primary response model with reliable tool calling and temperature 0 for consistency.
export const model = new ChatGroq({
  apiKey: env.GROQ_API_KEY,
  model: env.GROQ_MODEL,
  temperature: 0,
})

// Small, fast model for inexpensive tasks such as guards and classification.
export const fastModel = new ChatGroq({
  apiKey: env.GROQ_API_KEY,
  model: env.GROQ_FAST_MODEL,
  temperature: 0,
})