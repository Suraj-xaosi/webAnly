import "server-only"
import { analyticsClassifierSchema } from "@repo/types/validation"
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

export async function isOnTopic(userMessage: string): Promise<boolean> {
  try {
    const classifier = fastModel.withStructuredOutput(analyticsClassifierSchema)
    const result = await classifier.invoke([
      new SystemMessage(
        "You are a classifier. Decide only whether the question is related to website traffic analytics. Do not provide advice or perform any other task."
      ),
      new HumanMessage(userMessage),
    ])
    return result.isAnalyticsRelated
  } catch (err) {
    console.error("[ai-guards] topic classifier failed:", err)
    return true
  }
}