// hooks/useExitPages.ts
import { useQuery } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";

export interface ExitPagePoint {
  name:     string;
  views:    number;
  exits:    number;
  exitRate: number; // percentage, 0-100
}

export interface ExitPagesResponse {
  from:  string;
  to:    string;
  total: number;
  data:  ExitPagePoint[];
}

export interface ExitPagesParams {
  domainId: string;
  from:     string;
  to:       string;
  limit?:   number;
}

export interface ApiError {
  message: string;
  status?: number;
}

async function fetchExitPages(params: ExitPagesParams): Promise<ExitPagesResponse> {
  const { domainId, from, to, limit = 100 } = params;

  const { data } = await axios.get<ExitPagesResponse>("/api/analytics/exit-pages", {
    params: { domainId, from, to, limit },
    timeout: 10_000,
  });

  return data;
}

export function normalizeExitPagesError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ error?: string }>;
    return {
      message: axiosErr.response?.data?.error ?? axiosErr.message,
      status:  axiosErr.response?.status,
    };
  }
  return { message: "An unexpected error occurred" };
}

export function useExitPages(params: ExitPagesParams) {
  const { domainId, from, to, limit = 100 } = params;

  return useQuery<ExitPagesResponse, ApiError>({
    queryKey: ["exit-pages", domainId, from, to, limit],
    queryFn: () => fetchExitPages(params),
    enabled: Boolean(domainId && from && to),
    placeholderData: (prev) => prev,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (error.status && error.status >= 400 && error.status < 500) return false;
      return failureCount < 1;
    },
  });
}