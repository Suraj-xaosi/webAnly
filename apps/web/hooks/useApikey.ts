import { getApikey } from "@/lib/Actions/getApikey";
import { useApiQuery } from "@/lib/shared/tanstackFunctions/api";
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys";

export function useApiKey(domainId: string, enabled = true) {
  return useApiQuery({
    queryKey: queryKeys.apikey(domainId),
    queryFn: async () => {
      const result = await getApikey(domainId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!domainId && enabled,
    staleTime: Infinity,
    gcTime: 0,
  });
}