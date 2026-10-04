"use client"

import { useState } from "react"
import { useDomain } from "@/hooks/domainCrud/useDomain"
import { useDeleteDomain } from "@/hooks/domainCrud/useDeleteDomain"
import { usePricing } from "@/hooks/razorpayIntegration/usePricing"
import { useRazorpayCheckout } from "@/hooks/razorpayIntegration/useRazorpayCheckout"
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
  CreditCardIcon,
} from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import type { Domain } from "@/lib/shared/types/domain"

function maskKey(key: string) {
  if (key.length <= 8) return "•".repeat(key.length)
  return `${key.slice(0, 4)}${"•".repeat(key.length - 8)}${key.slice(-4)}`
}

// Turns the domain's type/state/endsAt into what the badge says and what
// the pay button should say. Only two real backend outcomes exist
// (REACTIVATE vs EXTEND)
function getBillingInfo(domain: Domain) {
  if (domain.state === "DEACTIVATED") {
    return {
      badgeLabel: "Expired",
      badgeClass: "bg-destructive/10 text-destructive",
      buttonLabel: "Reactivate",
    }
  }

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (new Date(domain.endsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
  )

  if (domain.type === "FREE") {
    return {
      badgeLabel: `Free · ${daysLeft}d left`,
      badgeClass: "bg-muted text-muted-foreground",
      buttonLabel: "Upgrade to Premium",
    }
  }

  return {
    badgeLabel: `Premium · ${daysLeft}d left`,
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    buttonLabel: "Extend +30 days",
  }
}

function BillingButton({
  domain,
  priceLabel,
}: {
  domain: Domain
  priceLabel: string | null
}) {
  const checkout = useRazorpayCheckout()
  const { badgeLabel, badgeClass, buttonLabel } = getBillingInfo(domain)

  const isThisDomainBusy =
    checkout.activeDomainId === domain.id &&
    ["creating-order", "awaiting-payment", "confirming"].includes(checkout.status)

  const statusText =
    checkout.status === "creating-order"
      ? "Starting checkout..."
      : checkout.status === "awaiting-payment"
        ? "Waiting for payment..."
        : checkout.status === "confirming"
          ? "Confirming payment..."
          : null

  return (
    <div className="flex flex-col gap-2">
      <span
        className={cn("w-fit rounded-full px-2 py-0.5 text-xs", badgeClass)}
      >
        {badgeLabel}
      </span>

      <Button
        size="sm"
        variant="outline"
        className="w-fit gap-1.5"
        disabled={isThisDomainBusy || !checkout.scriptReady}
        onClick={() => checkout.payForDomain(domain)}
      >
        {isThisDomainBusy ? (
          <Loader2Icon className="size-3.5 animate-spin" />
        ) : (
          <CreditCardIcon className="size-3.5" />
        )}
        {isThisDomainBusy
          ? statusText
          : `${buttonLabel}${priceLabel ? ` — ${priceLabel}` : ""}`}
      </Button>

      {checkout.scriptStatus === "loading" && (
        <p className="text-xs text-muted-foreground">
          Loading secure checkout…
        </p>
      )}
      {checkout.scriptStatus === "error" && (
        <p className="text-xs text-destructive" role="alert">
          Secure checkout couldn&apos;t load. Check your connection or browser extensions, then reload this page.
        </p>
      )}
      {checkout.status === "error" && checkout.activeDomainId === domain.id && (
        <p className="text-xs text-destructive" role="alert">
          {checkout.errorMessage ?? "Checkout couldn't be started (no need). Service will be for FREE now  . he he"}
        </p>
      )}
    </div>
  )
}

function ApiKeyRow({
  domain,
  priceLabel,
}: {
  domain: Domain
  priceLabel: string | null
}) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const deleteMutation = useDeleteDomain()

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
          {domain.domainName}
        </CardTitle>
        <CardDescription>
          Use this key in the <code>data-api-key</code> attribute of your
          tracking script.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-md bg-muted px-3 py-2 font-mono text-sm">
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

        <div className="flex items-center justify-between border-t pt-3">
          <BillingButton domain={domain} priceLabel={priceLabel} />

          {deleteMutation.error && (
            <p className="text-sm text-destructive">
              {deleteMutation.error.message}
            </p>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="destructive"
                className="ml-auto gap-1.5"
                disabled={deleteMutation.isPending}
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
                <AlertDialogTitle>Delete {domain.domainName}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this domain, its API key, and all
                  collected analytics data for it. This action cannot be undone.
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
      </CardContent>
    </Card>
  )
}

export function DomainApiKeySection() {
  const { data: domains, isLoading, error, refetch } = useDomain()
  const { data: pricing } = usePricing()

  const priceLabel = pricing ? `₹${pricing.paidDomainPrice / 100}` : null

  if (isLoading && !domains) {
    return (
      <div className="grid gap-4" role="status" aria-busy="true" aria-label="Loading domain keys">
        {[0, 1].map((item) => (
          <div key={item} className="grid gap-3 rounded-xl border p-5">
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
    <div className="flex flex-col gap-4">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          Could not refresh domains: {error.message}
        </p>
      )}
      {domains.map((domain) => (
        <ApiKeyRow
          key={domain.id}
          domain={domain as unknown as Domain}
          priceLabel={priceLabel}
        />
      ))}
    </div>
  )
}
