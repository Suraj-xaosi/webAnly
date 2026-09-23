import { getPricing } from "@/lib/Actions/getPricing";
import { useApiQuery } from "@/lib/shared/tanstackFunctions/api";
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys";

export function usePricing() {
  return useApiQuery({
    queryKey: queryKeys.pricing(),
    queryFn: async () => {
      const result = await getPricing();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    // Pricing changes rarely — cache generously, same  as useApiKey.
    staleTime: 1000 * 60 * 5,
  });
}