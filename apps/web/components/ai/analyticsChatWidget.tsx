"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState } from "react"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { SendIcon, Loader2Icon, SparklesIcon } from "lucide-react"

function renderInlineMarkdown(text: string) {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\((?:[^)]+)\))/g)

  return tokens.map((token, index) => {
    if (token.startsWith("`") && token.endsWith("`")) {
      return <code key={index} className="rounded bg-black/10 px-1 py-0.5 text-[0.9em]">{token.slice(1, -1)}</code>
    }
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={index}>{token.slice(2, -2)}</strong>
    }
    const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)\$/)
    if (link) {
      return <a key={index} href={link[2]} target="_blank" rel="noreferrer" className="underline underline-offset-2">{link[1]}</a>
    }
    return <span key={index}>{token}</span>
  })
}

function AssistantMessage({ text }: { text: string }) {
  const blocks: React.ReactNode[] = []
  const codeLines: string[] = []
  let inCodeBlock = false

  text.split("\n").forEach((line, index) => {
    if (line.trim().startsWith("```")) {
      if (inCodeBlock) {
        blocks.push(<pre key={`code-${index}`} className="my-2 overflow-x-auto rounded-md bg-black/10 p-3 text-xs leading-relaxed"><code>{codeLines.join("\n")}</code></pre>)
        codeLines.length = 0
      }
      inCodeBlock = !inCodeBlock
      return
    }
    if (inCodeBlock) {
      codeLines.push(line)
      return
    }

    const heading = line.match(/^#{1,3}\s+(.+)\$/)
    const bullet = line.match(/^\s*[-*]\s+(.+)\$/)
    const numbered = line.match(/^\s*\d+[.)]\s+(.+)\$/)
    if (heading) {
      blocks.push(<p key={index} className="mt-3 font-semibold first:mt-0">{renderInlineMarkdown(heading[1] ?? "")}</p>)
    } else if (bullet || numbered) {
      blocks.push(<div key={index} className="flex gap-2 pl-1"><span className="text-muted-foreground">•</span><span>{renderInlineMarkdown((bullet ?? numbered)?.[1] ?? "")}</span></div>)
    } else if (line.trim()) {
      blocks.push(<p key={index} className="leading-relaxed">{renderInlineMarkdown(line)}</p>)
    }
  })
  if (inCodeBlock) {
    blocks.push(<pre key="code-end" className="my-2 overflow-x-auto rounded-md bg-black/10 p-3 text-xs leading-relaxed"><code>{codeLines.join("\n")}</code></pre>)
  }
  return <div>{blocks}</div>
}

export function AnalyticsChatWidget({ domainId }: { domainId: string }) {
  const [input, setInput] = useState("")

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/ai/chat",
      body: { domainId },
    }),
  })

  const isLoading = status === "streaming" || status === "submitted"

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput("")
  }

  return (
    <div className="flex h-full min-h-0 flex-col text-foreground">
      <div className="flex shrink-0 items-center gap-2 border-b border-border/50 px-5 py-4">
        <SparklesIcon className="size-4 text-primary" />
        <p className="text-sm font-semibold">Traffic Assistant</p>
      </div>

      {/* Styled custom scrollbar applies here */}
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/40">
        {messages.length === 0 && (
          <div className="mt-10 text-center text-sm text-muted-foreground">Ask &quot;How was traffic last week?&quot;</div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[min(78%,720px)] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                message.role === "user" ? "bg-primary text-primary-foreground" : "border border-border/60 bg-background/75 backdrop-blur-md"
              }`}
            >
              {message.parts.map((part, i) =>
                part.type === "text" ? (message.role === "assistant" ? <AssistantMessage key={i} text={part.text} /> : <span key={i} className="whitespace-pre-wrap">{part.text}</span>) : null
              )}
            </div>
          </div>
        ))}
        {isLoading && <div className="mb-4 flex"><div className="rounded-2xl border border-border/60 bg-background/75 px-4 py-3 backdrop-blur-md"><Loader2Icon className="size-4 animate-spin text-muted-foreground" /></div></div>}
        {error && (
          <p className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error.message || "The assistant could not respond. Please try again."}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-2 border-t border-border/50 p-4">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          disabled={isLoading}
        />
        <Button type="submit" size="icon" aria-label="Send message" disabled={isLoading || !input.trim()}>
          <SendIcon className="size-4" />
        </Button>
      </form>
    </div>
  )
}
