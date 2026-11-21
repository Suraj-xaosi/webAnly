import { getDomainSummaries } from "@/lib/Actions/getDomainSummaries"
import { useApiQuery } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"

export function useDomainSummaries() {
  return useApiQuery({
    queryKey: queryKeys.domainSummaries(),
    queryFn: async () => {
      const result = await getDomainSummaries()
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    staleTime: 1000 * 60 * 5,
  })
}
