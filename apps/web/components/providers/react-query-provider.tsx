
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useEffect, useState } from "react";
import StoreProvider from "./store-provider";

const MAX_INACTIVE_QUERY_ENTRIES = 100;

export default function ReactQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    return queryClient.getQueryCache().subscribe(() => {
      const inactiveQueries = queryClient
        .getQueryCache()
        .getAll()
        .filter((query) => query.getObserversCount() === 0);

      if (inactiveQueries.length <= MAX_INACTIVE_QUERY_ENTRIES) return;

      inactiveQueries.sort(
        (left, right) =>
          (left.state.dataUpdatedAt || left.state.errorUpdatedAt) -
          (right.state.dataUpdatedAt || right.state.errorUpdatedAt)
      );

      for (const query of inactiveQueries.slice(
        0,
        inactiveQueries.length - MAX_INACTIVE_QUERY_ENTRIES
      )) {
        queryClient.getQueryCache().remove(query);
      }
    });
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        {children}
      </StoreProvider>
    </QueryClientProvider>
  );
}