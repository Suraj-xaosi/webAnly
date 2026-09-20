// Dimension Analytics
export type Dimension = "page" | "browser" | "device" | "country"| "city" | "os" | "referrer";

export interface DimensionPoint {
  name: string;
  views: number;
  visitors: number;
  avgDwell: number; // seconds
  viewsPerVisitor: number;
}

export interface DimensionResponse {
  dimension: Dimension;
  from: string;
  to: string;
  total: number;
  data: DimensionPoint[];
  timezone?:string;
}

export interface DimensionParams {
  domainId: string;
  from: string; // "YYYY-MM-DD"
  to: string; // "YYYY-MM-DD"
  timezone?: string;
  dimension: Dimension;
  limit?: number; // default 100, max 500
  domainName?: string;
}

// Exit Pages Analytics
export interface ExitPagePoint {
  name: string;
  views: number;
  exits: number;
  exitRate: number; // percentage, 0-100
}

export interface ExitPagesResponse {
  from: string;
  to: string;
  total: number;
  timezone?:string;
  data: ExitPagePoint[];
}

export interface ExitPagesParams {
  domainId: string;
  from: string;
  to: string;
  limit?: number;
  timezone?: string;
}

export type FlowEntryType = "page" | "source" | "exit" | "other";

export interface FlowEntry {
  name: string;
  type: FlowEntryType;
  views: number;
  visitors: number;
}

export interface FlowResponse {
  page: string;
  from: string;
  to: string;
  timezone: string;
  incoming: FlowEntry[];
  outgoing: FlowEntry[];
}

export interface FlowParams {
  domainId: string;
  page: string;
  from: string;
  to: string;
  timezone?: string;
}

// Timeseries Analytics
export type Interval = "hour" | "dayname" | "day" | "week" | "month";

export interface TimeseriesPoint {
  date: string;
  views: number;
  visitors: number;
}

export interface TimeseriesResponse {
  interval: Interval;
  from: string;
  to: string;
  timezone?:string;
  data: TimeseriesPoint[];
}

export interface TimeseriesParams {
  domainId: string;
  from: string; // "YYYY-MM-DD"
  to: string; // "YYYY-MM-DD"
  interval?: Interval;
  timezone?: string;
}

// Dimension Drilldown Timeseries (NEW — for popup)
export interface DimensionTimeseriesParams {
  domainId: string;
  from: string;
  to: string;
  interval?: Interval;
  timezone?: string;
  dimension: Dimension;
  value: string;
}

export interface DimensionTimeseriesResponse {
  dimension: Dimension;
  value: string;
  interval: Interval;
  from: string;
  to: string;
  timezone?: string;
  data: TimeseriesPoint[];
}