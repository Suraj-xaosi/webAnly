"use client"

import { useState } from "react"
import { useDomain } from "@/hooks/domainCrud/useDomain"
import { useDeleteDomain } from "@/hooks/domainCrud/useDeleteDomain"
import { useRotateDomainApiKey } from "@/hooks/domainCrud/useRotateDomainApiKey"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog"
import {
  EyeIcon,
  EyeOffIcon,
  CopyIcon,
  CheckIcon,
  KeyIcon,
  Trash2Icon,
  Loader2Icon,
  RotateCwIcon,
} from "lucide-react"
import { getDisplayDomainName } from "@workspace/ui/lib/domainName"
import type { Domain } from "@/types/domain"

function maskKey(key: string) {
  if (key.length <= 8) return "•".repeat(key.length)
  return `${key.slice(0, 4)}${"•".repeat(key.length - 8)}${key.slice(-4)}`
}

function ApiKeyRow({
  domain,
}: {
  domain: Domain
}) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const deleteMutation = useDeleteDomain()
  const rotateMutation = useRotateDomainApiKey()

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(domain.apikey)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyIcon className="size-4" />
          {getDisplayDomainName(domain.domainName)}
        </CardTitle>
        <CardDescription>
          Use this key in the <code>data-api-key</code> attribute of your
          tracking script.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <code className="min-w-0 flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm break-all">
            {revealed ? domain.apikey : maskKey(domain.apikey)}
          </code>
          <Button
            size="icon"
            variant="outline"
            className="size-9 shrink-0"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide API key" : "Show API key"}
          >
            {revealed ? (
              <EyeOffIcon className="size-4" />
            ) : (
              <EyeIcon className="size-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-9 shrink-0"
            onClick={handleCopy}
            aria-label="Copy API key"
          >
            {copied ? (
              <CheckIcon className="size-4" />
            ) : (
              <CopyIcon className="size-4" />
            )}
          </Button>
        </div>

        {rotateMutation.error && (
          <p className="text-sm text-destructive" role="alert">
            {rotateMutation.error.message}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          {deleteMutation.error && (
            <p className="w-full text-sm text-destructive" role="alert">
              {deleteMutation.error.message}
            </p>
          )}
          <div className="ml-auto flex flex-wrap gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  disabled={
                    rotateMutation.isPending || deleteMutation.isPending
                  }
                >
                  {rotateMutation.isPending ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <RotateCwIcon className="size-3.5" />
                  )}
                  Regenerate API key
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Regenerate the API key for{" "}
                    {getDisplayDomainName(domain.domainName)}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    The current key will stop working. Update the tracking
                    script on your site with the new key after regeneration. You
                    can regenerate this domain&apos;s key once every 60 seconds.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => rotateMutation.mutate(domain.id)}
                  >
                    Regenerate key
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1.5"
                  disabled={
                    deleteMutation.isPending || rotateMutation.isPending
                  }
                >
                  {deleteMutation.isPending ? (
                    <Loader2Icon className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2Icon className="size-3.5" />
                  )}
                  Delete domain
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete {getDisplayDomainName(domain.domainName)}?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this domain, its API key, and
                    all collected analytics data for it. This action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate(domain.id)}
                    className="text-destructive-foreground bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function DomainApiKeySection() {
  const { data: domains, isLoading, error, refetch } = useDomain()

  if (isLoading && !domains) {
    return (
      <div
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="status"
        aria-busy="true"
        aria-label="Loading domain API keys"
      >
        {[0, 1].map((item) => (
          <div
            key={item}
            className="grid w-full max-w-[36rem] shrink-0 snap-start gap-3 rounded-xl border p-5"
          >
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56 max-w-full" />
            <Skeleton className="h-8 w-32" />
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
        No domains yet — add one below to get an API key.
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
        aria-label="API keys by domain. Scroll horizontally to view more."
        tabIndex={0}
      >
        {domains.map((domain) => (
          <div
            key={domain.id}
            className="w-full max-w-[36rem] shrink-0 snap-start"
          >
            <ApiKeyRow
              domain={domain as unknown as Domain}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
