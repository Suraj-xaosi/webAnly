import "server-only"
import { ChatGroq } from "@langchain/groq"
import { env } from "@/lib/env/server"

// Asli jawab dene wala model — reliable tool-calling, temperature 0 (consistent)
export const model = new ChatGroq({
  apiKey: env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
  temperature: 0,
})

// Chhota, tez model — sirf guard/classifier jaise sasta kaam ke liye
export const fastModel = new ChatGroq({
  apiKey: env.GROQ_API_KEY,
  model: "llama-3.1-8b-instant",
  temperature: 0,
})