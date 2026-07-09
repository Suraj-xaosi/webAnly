// web/components/domains/DomainApiKeySection.tsx
"use client"

import { useState, useTransition } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useDomain } from "@/hooks/useDomain"
import { deleteDomain } from "@/lib/Actions/deleteDomain"
import { Button } from "@workspace/ui/components/button"
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
import { EyeIcon, EyeOffIcon, CopyIcon, CheckIcon, KeyIcon, Trash2Icon, Loader2Icon } from "lucide-react"

function maskKey(key: string) {
  if (key.length <= 8) return "•".repeat(key.length)
  return `${key.slice(0, 4)}${"•".repeat(key.length - 8)}${key.slice(-4)}`
}

function ApiKeyRow({ domainId, domainName, apikey }: { domainId: string; domainName: string; apikey: string }) {
  const queryClient = useQueryClient()
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handleCopy() {
    await navigator.clipboard.writeText(apikey)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  function handleDelete() {
    setDeleteError(null)
    startTransition(async () => {
      const result = await deleteDomain(domainId)
      if (result.error) {
        setDeleteError(result.error)
        return
      }
      queryClient.invalidateQueries({ queryKey: ["domain"] })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyIcon className="size-4" />
          {domainName}
        </CardTitle>
        <CardDescription>
          Use this key in the <code>data-api-key</code> attribute of your tracking script.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono">
            {revealed ? apikey : maskKey(apikey)}
          </code>
          <Button
            size="icon"
            variant="outline"
            className="size-9 shrink-0"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide API key" : "Show API key"}
          >
            {revealed ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-9 shrink-0"
            onClick={handleCopy}
            aria-label="Copy API key"
          >
            {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
          </Button>
        </div>

        <div className="flex items-center justify-between border-t pt-3">
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="ml-auto gap-1.5"
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2Icon className="size-3.5 animate-spin" />
                ) : (
                  <Trash2Icon className="size-3.5" />
                )}
                Delete domain
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {domainName}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this domain, its API key, and all collected
                  analytics data for it. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

export function DomainApiKeySection() {
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
        No domains yet — add one below to get an API key.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {domains.map((domain) => (
        <ApiKeyRow
          key={domain.id}
          domainId={domain.id}
          domainName={domain.domainName}
          apikey={domain.apikey}
        />
      ))}
    </div>
  )
}