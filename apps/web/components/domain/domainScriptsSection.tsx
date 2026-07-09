// web/components/domains/DomainScriptsSection.tsx
"use client"

import { useState } from "react"
import { useDomain } from "@/hooks/useDomain"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { CopyIcon, CheckIcon, GlobeIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

const COLLECTOR_SCRIPT_URL =
  process.env.NEXT_PUBLIC_COLLECTOR_SCRIPT_URL || "http://localhost:3000/script.js"

function buildSnippet(domainName: string, apikey: string) {
  return `<script
  src="${COLLECTOR_SCRIPT_URL}"
  data-domain-name="${domainName}"
  data-api-key="${apikey}">
</script>`
}

function ScriptBlock({ domainName, apikey }: { domainName: string; apikey: string }) {
  const [copied, setCopied] = useState(false)
  const snippet = buildSnippet(domainName, apikey)

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative">
      <pre className="rounded-md bg-muted px-4 py-3 text-xs overflow-x-auto font-mono leading-relaxed">
        {snippet}
      </pre>
      <Button
        size="sm"
        variant="outline"
        className="absolute top-2 right-2 gap-1.5 text-xs h-7"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            <CheckIcon className="size-3.5" />
            Copied
          </>
        ) : (
          <>
            <CopyIcon className="size-3.5" />
            Copy
          </>
        )}
      </Button>
    </div>
  )
}

export function DomainScriptsSection() {
  const { data: domains, isLoading, error } = useDomain()

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading domains...</p>
  }

  if (error) {
    return <p className="text-sm text-destructive">Error: {error.message}</p>
  }

  if (!domains || domains.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No domains yet — add one below to get your tracking script.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {domains.map((domain) => (
        <Card key={domain.id}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <GlobeIcon className="size-4" />
              {domain.domainName}
              <span
                className={cn(
                  "ml-auto text-xs px-2 py-0.5 rounded-full",
                  domain.isActive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {domain.isActive ? "Active" : "Inactive"}
              </span>
            </CardTitle>
            <CardDescription>
              Paste this snippet into your site's <code>&lt;head&gt;</code> tag.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScriptBlock domainName={domain.domainName} apikey={domain.apikey} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}