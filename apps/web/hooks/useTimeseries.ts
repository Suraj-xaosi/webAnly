// hooks/useTimeseries.ts
import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

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
  data: TimeseriesPoint[];
}

export interface TimeseriesParams {
  domainId: string;
  from: string;       // "YYYY-MM-DD"
  to: string;         // "YYYY-MM-DD"
  interval?: Interval;
}


export interface ApiError {
  message: string;
  status?: number;
}

async function fetchTimeseries(params: TimeseriesParams): Promise<TimeseriesResponse> {
  const { domainId, from, to, interval } = params;

  const { data } = await axios.get<TimeseriesResponse>("/api/analytics/timeseries", {
    params: { domainId, from, to, interval },
    // Abort if server takes more than 10s
    timeout: 10_000,
  });

  return data;
}

export function useTimeseries(params: TimeseriesParams) {
  const { domainId, from, to, interval = "hour" } = params;

  return useQuery<TimeseriesResponse, ApiError>({
    
    queryKey: ["timeseries", domainId, from, to, interval],

    queryFn: () => fetchTimeseries(params),

    
    enabled: Boolean(domainId && from && to),

    
    placeholderData: (prev) => prev,

    
    staleTime: 2 * 60 * 1000,
    gcTime:    5 * 60 * 1000,

    
    retry: (failureCount, error) => {
      if (error.status && error.status >= 400 && error.status < 500) return false;
      return failureCount < 1;
    },

    
    throwOnError: false,
    select: (data) => data,
  });
}

// Utility — call outside React (prefetch, server components, etc.)
export async function prefetchTimeseries(
  queryClient: import("@tanstack/react-query").QueryClient,
  params: TimeseriesParams
) {
  await queryClient.prefetchQuery({
    queryKey: ["timeseries", params.domainId, params.from, params.to, params.interval ?? "hour"],
    queryFn:  () => fetchTimeseries(params),
    staleTime: 2 * 60 * 1000,
  });
}

// Global Axios error normalizer — register once in your app root
export function normalizeAxiosError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ error?: string }>;
    return {
      message: axiosErr.response?.data?.error ?? axiosErr.message,
      status:  axiosErr.response?.status,
    };
  }
  return { message: "An unexpected error occurred" };
}