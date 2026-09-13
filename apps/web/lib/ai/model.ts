import "server-only"
import { ChatGroq } from "@langchain/groq"
import { env } from "@/lib/env/server"

export const model = new ChatGroq({
    apiKey: env.GROQ_API_KEY,
    model: "openai/gpt-oss-120b",
    temperature: 0,
})

export const fastModel = new ChatGroq({
  apiKey: env.GROQ_API_KEY,
  model: "openai/gpt-oss-120b",
  temperature: 0,
})