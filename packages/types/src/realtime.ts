import type { DimensionPoint, TimeseriesPoint } from "./analytics.js"
import type { ApiError } from "./api.js"

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
  isLoading: boolean
  isError: boolean
  error?: ApiError | null
  isLive: boolean
}
