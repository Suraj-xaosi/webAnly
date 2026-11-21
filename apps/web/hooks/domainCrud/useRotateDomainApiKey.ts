import { useQueryClient } from "@tanstack/react-query"
import { rotateDomainApiKey } from "@/lib/Actions/rotateDomainApiKey"
import { useApiMutation } from "@/lib/api"
import { queryKeys } from "@/lib/queryKeys"

export function useRotateDomainApiKey() {
  const queryClient = useQueryClient()

  return useApiMutation({
    mutationFn: async (domainId: string) => {
      const result = await rotateDomainApiKey(domainId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.domain() })
    },
  })
}
