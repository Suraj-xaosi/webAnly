import "server-only"
import { z } from "zod"
import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { fastModel } from "./model"

const MAX_MESSAGE_LENGTH = 500

export function checkMessageLength(userMessage: string): { ok: boolean; error?: string } {
  const trimmed = userMessage.trim()

  if (trimmed.length === 0) {
    return { ok: false, error: "Please enter a question." }
  }
  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `Your message is too long (maximum ${MAX_MESSAGE_LENGTH} characters). Please ask a shorter, more specific question.`,
    }
  }
  return { ok: true }
}

const classifierSchema = z.object({
  isAnalyticsRelated: z
    .boolean()
    .describe(
      "True if the question is about website analytics data such as traffic, visitors, page views, browsers, devices, countries, referrers, trends, or exit pages. False if it is about coding, essays, recipes, or anything else."
    ),
})

export async function isOnTopic(userMessage: string): Promise<boolean> {
  try {
    const classifier = fastModel.withStructuredOutput(classifierSchema)
    const result = await classifier.invoke([
      new SystemMessage(
        "You are a classifier. Decide only whether the question is related to website traffic analytics. Do not provide advice or perform any other task."
      ),
      new HumanMessage(userMessage),
    ])
    return result.isAnalyticsRelated
  } catch (err) {
    console.error("[ai-guards] topic classifier failed:", err)
    // Keep the feature available if the classifier fails; the main agent can
    // handle off-topic requests through its system prompt.
    return true
  }
}