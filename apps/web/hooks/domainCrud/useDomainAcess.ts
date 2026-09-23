import { isActiveDomain } from "@/lib/Actions/isActiveDomain"
import { useApiQuery } from "@/lib/shared/tanstackFunctions/api"
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys"

export function useDomainAccess(domainId: string) {
  return useApiQuery({
    queryKey: queryKeys.domainAccess(domainId),
    queryFn: async () => {
      const result = await isActiveDomain(domainId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    enabled: !!domainId,
    staleTime: 0,
  })
}