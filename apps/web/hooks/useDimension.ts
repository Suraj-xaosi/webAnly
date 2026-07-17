// hooks/useDimension.ts
import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";



export type Dimension = "page" | "browser" | "device" | "country" | "os" | "referrer";

export interface DimensionPoint {
  name:            string;
  views:           number;
  visitors:        number;
  avgDwell:        number;   // seconds
  viewsPerVisitor: number;
}

export interface DimensionResponse {
  dimension: Dimension;
  from:      string;
  to:        string;
  total:     number;
  data:      DimensionPoint[];
}

export interface DimensionParams {
  domainId:  string;
  from:      string;       // "YYYY-MM-DD"
  to:        string;       // "YYYY-MM-DD"
  timezone?: string;       // optional timezone, e.g., "UTC", "America/New_York"
  dimension: Dimension;
  limit?:    number;       // default 100, max 500
}

export interface ApiError {
  message: string;
  status?: number;
}

// ─── fetcher ──────────────────────────────────────────────────────────────────

async function fetchDimension(params: DimensionParams): Promise<DimensionResponse> {
  const { domainId, from, to, dimension, limit = 100,timezone } = params;

  const { data } = await axios.get<DimensionResponse>("/api/analytics/dimension", {
    params: { domainId, from, to, dimension, limit, timezone },
    timeout: 10_000,
  });

  return data;
}

// ─── error normalizer ─────────────────────────────────────────────────────────

export function normalizeDimensionError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ error?: string }>;
    return {
      message: axiosErr.response?.data?.error ?? axiosErr.message,
      status:  axiosErr.response?.status,
    };
  }
  return { message: "An unexpected error occurred" };
}

// ─── hook ─────────────────────────────────────────────────────────────────────

export function useDimension(params: DimensionParams) {
  const { domainId, from, to, dimension, limit = 100 , timezone} = params;

  return useQuery<DimensionResponse, ApiError>({

    queryKey: ["dimension", domainId, from, to, dimension, limit, timezone],

    queryFn: () => fetchDimension(params),


    enabled: Boolean(domainId && from && to && dimension),


    placeholderData: (prev) => prev,


    staleTime: 3 * 60 * 1000,   // 3 min — slightly longer than timeseries
    gcTime:    10 * 60 * 1000,  // 10 min — keep in memory across tab switches

 
    retry: (failureCount, error) => {
      if (error.status && error.status >= 400 && error.status < 500) return false;
      return failureCount < 1;
    },
  });
}



export async function prefetchDimension(
  queryClient: import("@tanstack/react-query").QueryClient,
  params: DimensionParams
) {
  await queryClient.prefetchQuery({
    queryKey: ["dimension", params.domainId, params.from, params.to, params.dimension, params.limit ?? 100],
    queryFn:  () => fetchDimension(params),
    staleTime: 3 * 60 * 1000,
  });
}