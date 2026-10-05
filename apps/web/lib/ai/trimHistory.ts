import "server-only"
import { trimMessages, type BaseMessage } from "@langchain/core/messages"
import { model } from "./model"

export async function trimHistory(messages: BaseMessage[]) {
  return trimMessages(messages, {
    maxTokens: 16000,
    strategy: "last",
    tokenCounter: model,
    includeSystem: true,
  })
}