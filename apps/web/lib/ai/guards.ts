import "server-only"
import { z } from "zod"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { fastModel } from "./model"

const MAX_MESSAGE_LENGTH = 500

export function checkMessageLength(userMessage: string): { ok: boolean; error?: string } {
  const trimmed = userMessage.trim()

  if (trimmed.length === 0) {
    return { ok: false, error: "Kuch toh likho — sawaal khaali hai." }
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `Message bahut lamba hai (max ${MAX_MESSAGE_LENGTH} characters). Chhota, seedha sawaal poochho.`,
    }
  }
  return { ok: true }
}

const classifierSchema = z.object({
  isAnalyticsRelated: z
    .boolean()
    .describe(
      "True agar sawaal website traffic, visitors, page views, browsers, devices, countries, referrers, trends ya exit-pages jaise analytics data ke baare mein hai. False agar coding, essays, recipes, ya kuch aur hai."
    ),
})

export async function isOnTopic(userMessage: string): Promise<boolean> {
  try {
    const classifier = fastModel.withStructuredOutput(classifierSchema)
    const result = await classifier.invoke([
      new SystemMessage(
        "Tum ek classifier ho. Sirf yeh decide karo ki sawaal website-traffic-analytics se related hai ya nahi. Koi advice mat do, koi aur kaam mat karo."
      ),
      new HumanMessage(userMessage),
    ])
    return result.isAnalyticsRelated
  } catch (err) {
    console.error("[ai-guards] topic classifier failed:", err)
    // Classifier hi fail ho jaaye (Groq down waghera) toh feature block mat karo —
    // fail-open, asli agent bhi off-topic jawab handle kar lega system prompt se
    return true
  }
}