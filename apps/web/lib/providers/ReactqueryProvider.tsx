//web/lib/providers/ReactqueryProvider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Store } from "lucide-react";
import { ReactNode, useState } from "react";
import StoreProvider from "./storeprovider";

export default function ReactqueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        {children}
      </StoreProvider>
    </QueryClientProvider>
  );
}