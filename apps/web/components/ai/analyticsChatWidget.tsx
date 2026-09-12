"use client"

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { useState } from "react"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { SendIcon, Loader2Icon, SparklesIcon } from "lucide-react"

export function AnalyticsChatWidget({ domainId }: { domainId: string }) {
  const [input, setInput] = useState("")

  const { messages, sendMessage, status } = useChat({
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
    <div className="flex h-[480px] flex-col">
      <div className="flex items-center gap-2 border-b px-3 py-2.5">
        <SparklesIcon className="size-4 text-primary" />
        <p className="text-sm font-semibold font-heading">Traffic Assistant</p>
      </div>

      <ScrollArea className="flex-1 px-3 py-2">
        {messages.length === 0 && (
          <p className="mt-4 text-sm text-muted-foreground">
            Poochho — &quot;Pichhle hafte traffic kaisa raha?&quot;
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-3 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              {message.parts.map((part, i) =>
                part.type === "text" ? <span key={i}>{part.text}</span> : null
              )}
            </div>
          </div>
        ))}
        {isLoading && <Loader2Icon className="size-4 animate-spin text-muted-foreground" />}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-2.5">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Apna sawaal likho..."
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
          <SendIcon className="size-4" />
        </Button>
      </form>
    </div>
  )
}