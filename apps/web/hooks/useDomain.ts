import { getDomain } from "@/lib/Actions/getDomain";
import { useApiQuery } from "@/lib/shared/tanstackFunctions/api";
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys";

export function useDomain() {
  return useApiQuery({
    queryKey: queryKeys.domain(),
    queryFn: async () => {
      const result = await getDomain();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.domains;
    },
    staleTime: 1000 * 60 * 5,
  });
}
