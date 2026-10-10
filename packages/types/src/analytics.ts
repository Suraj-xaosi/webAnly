export const ANALYTICS_DIMENSIONS = [
  "page",
  "browser",
  "device",
  "country",
  "city",
  "os",
  "referrer",
] as const

export type Dimension = (typeof ANALYTICS_DIMENSIONS)[number]

export interface DimensionPoint {
  name: string
  views: number
  visitors: number
  avgDwell: number
  viewsPerVisitor: number
}

export interface DimensionResponse {
  dimension: Dimension
  from: string
  to: string
  total: number
  data: DimensionPoint[]
  timezone?: string
}

export interface DimensionParams {
  domainId: string
  from: string
  to: string
  timezone?: string
  dimension: Dimension
  limit?: number
  domainName?: string
}

export interface ExitPagePoint {
  name: string
  views: number
  exits: number
  exitRate: number
}

export interface ExitPagesResponse {
  from: string
  to: string
  total: number
  timezone?: string
  data: ExitPagePoint[]
}

export interface ExitPagesParams {
  domainId: string
  from: string
  to: string
  limit?: number
  timezone?: string
}

export type FlowEntryType = "page" | "source" | "exit" | "other"

export interface FlowEntry {
  name: string
  type: FlowEntryType
  views: number
  visitors: number
}

export interface FlowResponse {
  page: string
  from: string
  to: string
  timezone: string
  incoming: FlowEntry[]
  outgoing: FlowEntry[]
}

export interface FlowParams {
  domainId: string
  page: string
  from: string
  to: string
  timezone?: string
}

export const ALL_PAGE_MAP_VALUE = "allpagemapp" as const

export interface PageMapNode {
  id: string
  label: string
  views: number
  visitors: number
  exits: number
}

export interface PageMapEdge {
  source: string
  target: string
  views: number
  visitors: number
}

export interface PageMapResponse {
  from: string
  to: string
  timezone: string
  nodes: PageMapNode[]
  edges: PageMapEdge[]
}

export const ANALYTICS_INTERVALS = [
  "hour",
  "dayname",
  "day",
  "week",
  "month",
] as const

export type Interval = (typeof ANALYTICS_INTERVALS)[number]

export interface TimeseriesPoint {
  date: string
  views: number
  visitors: number
}

export interface TimeseriesResponse {
  interval: Interval
  from: string
  to: string
  timezone?: string
  data: TimeseriesPoint[]
}

export interface TimeseriesParams {
  domainId: string
  from: string
  to: string
  interval?: Interval
  timezone?: string
}

export interface DimensionTimeseriesParams {
  domainId: string
  from: string
  to: string
  interval?: Interval
  timezone?: string
  dimension: Dimension
  value: string
}

export interface DimensionTimeseriesResponse {
  dimension: Dimension
  value: string
  interval: Interval
  from: string
  to: string
  timezone?: string
  data: TimeseriesPoint[]
}
