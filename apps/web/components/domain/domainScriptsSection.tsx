"use client"

import { useState } from "react"
import { useDomain } from "@/hooks/domainCrud/useDomain"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { CopyIcon, CheckIcon, GlobeIcon } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { getDisplayDomainName } from "@workspace/ui/lib/domainName"
import { publicEnv } from "@/lib/env/client"

const COLLECTOR_SCRIPT_URL =
  publicEnv.NEXT_PUBLIC_COLLECTOR_SCRIPT_URL ||
  "http://localhost:3000/script.js"
const COLLECT_API_URL =
  publicEnv.NEXT_PUBLIC_COLLECT_API_URL || "http://localhost:4000/collect"
function buildNextSnippet(domainName: string, apikey: string) {
  return `<script
  src="${COLLECTOR_SCRIPT_URL}"
  data-collect-api-url="${COLLECT_API_URL}"
  data-domain-name="${domainName}"
  data-api-key="${apikey}">
</script>`
}

function buildReactSnippet(domainName: string, apikey: string) {
  return `const script = document.createElement("script")
script.src = "${COLLECTOR_SCRIPT_URL}"
script.setAttribute("data-collect-api-url", "${COLLECT_API_URL}")
script.setAttribute("data-domain-name", "${domainName}")
script.setAttribute("data-api-key", "${apikey}")
script.async = true
document.head.appendChild(script)`
}

function ScriptBlock({
  domainName,
  apikey,
  framework,
}: {
  domainName: string
  apikey: string
  framework: "next" | "react"
}) {
  const [copied, setCopied] = useState(false)
  const snippet =
    framework === "next"
      ? buildNextSnippet(domainName, apikey)
      : buildReactSnippet(domainName, apikey)

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="relative">
      <pre
        className="overflow-x-auto rounded-md bg-muted px-4 py-3 font-mono text-xs leading-relaxed [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
        tabIndex={0}
        aria-label={`${framework} tracking script`}
      >
        {snippet}
      </pre>
      <Button
        size="sm"
        variant="outline"
        className="absolute top-2 right-2 h-7 gap-1.5 text-xs"
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
  const { data: domains, isLoading, error, refetch } = useDomain()

  if (isLoading && !domains) {
    return (
      <div
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="status"
        aria-busy="true"
        aria-label="Loading domain scripts"
      >
        {[0, 1].map((item) => (
          <div
            key={item}
            className="grid w-full max-w-[42rem] shrink-0 snap-start gap-4 rounded-xl border p-5"
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64 max-w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (error && !domains) {
    return (
      <div className="grid justify-items-start gap-2" role="alert">
        <p className="text-sm text-destructive">{error.message}</p>
        <Button variant="outline" size="sm" onClick={() => void refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  if (!domains || domains.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No domains yet — add one below to get your tracking script.
      </p>
    )
  }

  return (
    <div className="grid gap-3">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          Could not refresh domains: {error.message}
        </p>
      )}
      <div
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto py-1 [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none [&::-webkit-scrollbar]:hidden"
        role="region"
        aria-label="Tracking scripts by domain. Scroll horizontally to view more."
        tabIndex={0}
      >
        {domains.map((domain) => {
          const isActive = domain.state === "ACTIVE"
          return (
            <Card
              key={domain.id}
              className="w-full max-w-[42rem] shrink-0 snap-start"
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GlobeIcon className="size-4" />
                  <span className="truncate">
                    {getDisplayDomainName(domain.domainName)}
                  </span>
                  <span
                    className={cn(
                      "ml-auto shrink-0 rounded-full px-2 py-0.5 text-xs",
                      isActive
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isActive ? "Active" : "Inactive"}
                  </span>
                </CardTitle>
                <CardDescription>
                  Add the tracking script to your Next.js or React application.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Next.js</p>
                  <p className="text-xs text-muted-foreground">
                    Paste into your site&apos;s <code>&lt;head&gt;</code> tag,
                    such as in
                    <code> layout.tsx</code>.
                  </p>
                  <ScriptBlock
                    domainName={getDisplayDomainName(domain.domainName)}
                    apikey={domain.apikey}
                    framework="next"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">React</p>
                  <p className="text-xs text-muted-foreground">
                    Paste into <code>main.tsx</code> before your app is
                    rendered.
                  </p>
                  <ScriptBlock
                    domainName={getDisplayDomainName(domain.domainName)}
                    apikey={domain.apikey}
                    framework="react"
                  />
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
