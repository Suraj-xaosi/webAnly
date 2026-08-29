import axios, { AxiosError } from "axios";
import {
  useMutation,
  useQuery,
  type QueryKey,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import type { ApiError } from "@/lib/shared/types/api";

export type { ApiError };

export function normalizeApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<{ error?: string }>;
    return {
      message: axiosErr.response?.data?.error ?? axiosErr.message,
      status: axiosErr.response?.status,
    };
  }

  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: "An unexpected error occurred" };
}

export function shouldRetryQuery(failureCount: number, error: ApiError) {
  if (error.status && error.status >= 400 && error.status < 500) {
    return false;
  }

  return failureCount < 1;
}

export function useApiQuery<TData, TError = ApiError>(
  options: Omit<UseQueryOptions<TData, TError>, "queryKey" | "queryFn"> & {
    queryKey: QueryKey;
    queryFn: () => Promise<TData>;
  }
) {
  return useQuery<TData, TError>({
    placeholderData: (prev) => prev,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => shouldRetryQuery(failureCount, normalizeApiError(error)),
    ...options,
  });
}

export function useApiMutation<TData, TVariables = void, TContext = unknown>(
  options: Omit<UseMutationOptions<TData, ApiError, TVariables, TContext>, "mutationFn"> & {
    mutationFn: (variables: TVariables) => Promise<TData>;
  }
) {
  const { mutationFn, ...rest } = options;

  return useMutation<TData, ApiError, TVariables, TContext>({
    mutationFn: async (variables: TVariables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        throw normalizeApiError(error);
      }
    },
    ...rest,
  });
}
