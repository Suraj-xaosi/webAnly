import { NextRequest } from "next/server"
import { toUIMessageStream } from "@ai-sdk/langchain"
import { createUIMessageStream, createUIMessageStreamResponse } from "ai"
import { requireSession } from "@/lib/Actions/requireSession"
import { findOwnedDomain } from "@/lib/Actions/findOwnedDomain"
import { todayInTimeZone } from "@/lib/shared/functions/TimeFunctions"
import { checkMessageLength, isOnTopic } from "@/lib/ai/guards"
import { checkTokenBudget, recordTokenUsage } from "@/lib/ai/tokenBudget"
import { trimHistory } from "@/lib/ai/trimHistory"
import { buildAnalyticsAgent } from "@/lib/ai/agent"
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages"

type IncomingUIMessage = {
  role: "user" | "assistant" | "system"
  parts?: { type: string; text?: string }[]
}

function extractText(message: IncomingUIMessage): string {
  return (message.parts ?? [])
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("")
}

// Guard-fail cases (login nahi, domain inactive, off-topic, etc) ke liye —
// ek chhota "canned text" stream, taaki client hamesha SAME format expect kare
function quickTextResponse(text: string) {
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      writer.write({ type: "text-start", id: "guard" })
      writer.write({ type: "text-delta", id: "guard", delta: text })
      writer.write({ type: "text-end", id: "guard" })
    },
  })
  return createUIMessageStreamResponse({ stream })
}

export async function POST(req: NextRequest) {
  let body: { domainId?: string; messages?: IncomingUIMessage[] }

  try {
    body = await req.json()
  } catch {
    return quickTextResponse("Request samajh nahi aayi, phir se try karo.")
  }

  const { domainId, messages } = body
  if (!domainId || !messages?.length) {
    return quickTextResponse("domainId aur message dono chahiye.")
  }

  const latestUserMessage = extractText(messages[messages.length - 1]!)

  try {
    // ── 1. Auth ──────────────────────────────────────────────
    const sessionResult = await requireSession()
    if (!sessionResult.success) return quickTextResponse("Please login karo.")

    // ── 2. Ownership check ───────────────────────────────────
    const domain = await findOwnedDomain(domainId, sessionResult.data.user.id, {
      id: true,
      domainName: true,
      state: true,
      defaultTimezone: true,
    })
    if (!domain) return quickTextResponse("Domain not found ya aapka nahi hai.")

    // ── 3. Active check ──────────────────────────────────────
    if (domain.state !== "ACTIVE") {
      return quickTextResponse(
        `${domain.domainName} abhi deactivated hai. Assistant sirf active domains ke liye kaam karta hai.`
      )
    }

    // ── 4. Per-message length guard (free) ───────────────────
    const lengthCheck = checkMessageLength(latestUserMessage)
    if (!lengthCheck.ok) return quickTextResponse(lengthCheck.error!)

    // ── 5. Daily token budget guard ──────────────────────────
    const budget = await checkTokenBudget(domain.id)
    if (!budget.ok) {
      return quickTextResponse("Aaj ke liye AI assistant ka limit khatam ho gaya. Kal try karo.")
    }

    // ── 6. Topic guard ───────────────────────────────────────
    const onTopic = await isOnTopic(latestUserMessage)
    if (!onTopic) {
      return quickTextResponse("Main sirf aapke website traffic analytics ke sawaalon mein madad kar sakta hoon.")
    }

    // ── 7. Conversation banao, trim karo ──────────────────────
    const today = todayInTimeZone(domain.defaultTimezone)
    const historyMessages = messages.slice(0, -1).map((m) => {
      const text = extractText(m)
      return m.role === "user" ? new HumanMessage(text) : new AIMessage(text)
    })

    const rawMessages = [
      new SystemMessage(
        `Aaj ki date hai ${today} (timezone: ${domain.defaultTimezone}). Tum "${domain.domainName}" ke traffic analytics assistant ho. Sirf isi domain ke traffic data ke baare mein baat karo — kisi doosre domain ka data mangne pe seedha mana kar do.`
      ),
      ...historyMessages,
      new HumanMessage(latestUserMessage),
    ]

    const trimmedMessages = await trimHistory(rawMessages)

    // ── 8. Agent chalao, streaming + token tracking + abort-on-disconnect ──
    const agent = buildAnalyticsAgent(domain.id, domain.defaultTimezone)

    let totalTokensUsed = 0

    const eventStream = agent.streamEvents(
      { messages: trimmedMessages },
      {
        version: "v2" as const,
        recursionLimit: 8,      // infinite-loop guard
        signal: req.signal,      // client disconnect ho toh agent bhi ruke
        callbacks: [
          {
            handleLLMEnd(output: any) {
              const usage = output?.llmOutput?.tokenUsage ?? output?.llmOutput?.estimatedTokenUsage
              if (usage?.totalTokens) totalTokensUsed += usage.totalTokens
            },
          },
        ],
      }
    )

    const uiMessageStream = toUIMessageStream(eventStream, {
      onError: (error: unknown) => {
        console.error("[ai-chat] stream error:", error)
      },
      onFinish: () => {
        void recordTokenUsage(domain.id, totalTokensUsed).catch((error) => {
          console.error("[ai-chat] token usage recording failed:", error)
        })
      },
    })

    return createUIMessageStreamResponse({ stream: uiMessageStream })
  } catch (err) {
    console.error("[ai-chat] setup error:", err)
    return quickTextResponse("Kuch galat ho gaya, thodi der baad try karo.")
  }
}