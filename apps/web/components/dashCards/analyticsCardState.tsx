"use client"

import type { ApiError } from "@/lib/shared/types/api"
import { Button } from "@workspace/ui/components/button"

interface AnalyticsCardStateProps {
  isLoading: boolean
  isError: boolean
  error?: ApiError | null
  hasData?: boolean
  onRetry?: () => void
}

export function AnalyticsCardState({
  isLoading,
  isError,
  error,
  hasData = false,
  onRetry,
}: AnalyticsCardStateProps) {
  if (isLoading && !hasData) {
    return (
      <div
        className="grid min-h-48 content-center gap-3 rounded-md border bg-card p-6"
        role="status"
        aria-busy="true"
      >
        <span className="sr-only">Loading analytics data</span>
        <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded bg-muted/70" />
      </div>
    )
  }

  if (isError) {
    return (
      <div
        className="grid gap-2 rounded-md border border-destructive/40 bg-card p-4 text-sm"
        role="alert"
      >
        <p className="font-medium">
          {hasData
            ? "Showing saved data; refresh failed."
            : "Analytics data couldn’t load."}
        </p>
        <p className="text-muted-foreground">
          {error?.message ?? "Unable to load analytics data. Please try again."}
        </p>
        {onRetry && (
          <Button
            className="mt-1 w-fit"
            size="sm"
            variant="outline"
            onClick={onRetry}
          >
            Try again
          </Button>
        )}
      </div>
    )
  }

  return null
}
