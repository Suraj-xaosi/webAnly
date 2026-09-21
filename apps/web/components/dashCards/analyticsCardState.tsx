"use client"

import type { ApiError } from "@/lib/shared/types/api"

interface AnalyticsCardStateProps {
  isLoading: boolean
  isError: boolean
  error?: ApiError | null
}

export function AnalyticsCardState({ isLoading, isError, error }: AnalyticsCardStateProps) {
  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error: {error?.message ?? "Unable to load analytics data."}</div>
  return null
}