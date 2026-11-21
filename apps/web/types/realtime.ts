import type { DimensionPoint, TimeseriesPoint, TimeseriesSummary } from "./analytics"
import type { ApiError } from "./api"

export interface WebSocketMessage {
  type: string
  data?: Record<string, any>
}

export interface RealtimeDimensionResult {
  data: DimensionPoint[]
  isLoading: boolean
  isError: boolean
  error?: ApiError | null
  isLive: boolean
}

export interface RealtimeTimeseriesResult {
  data: TimeseriesPoint[]
  summary?: TimeseriesSummary
  isLoading: boolean
  isError: boolean
  error?: ApiError | null
  isLive: boolean
}
