// web/components/docs/codeBlock.tsx
"use client"

import { useState } from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"

interface CodeBlockProps {
  code: string
  language?: string
}

export function CodeBlock({ code, language = "html" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative rounded-lg border bg-muted/50">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="font-mono text-xs text-muted-foreground">{language}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
          {copied ? <CheckIcon className="h-3.5 w-3.5" /> : <CopyIcon className="h-3.5 w-3.5" />}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}