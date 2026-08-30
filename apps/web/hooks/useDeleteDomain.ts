// apps/web/hooks/useDeleteDomain.ts

import { useQueryClient } from "@tanstack/react-query"
import { deleteDomain } from "@/lib/Actions/deleteDomain"
import { useApiMutation } from "@/lib/shared/tanstackFunctions/api"
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys"
import { useAppDispatch, useAppSelector } from "@/store/hooks"          // naya import
import { selectDomainId, setDomainId } from "@/store/slices/dashboardSlice" // naya import

export function useDeleteDomain() {
  const queryClient = useQueryClient()
  const dispatch = useAppDispatch()              // naya
  const currentDomainId = useAppSelector(selectDomainId)  // naya

  return useApiMutation({
    mutationFn: async (domainId: string) => {
        const result = await deleteDomain(domainId)
        if (!result.success) throw new Error(result.error)
        return result.data
    },

    onMutate: async (domainId: string) => {
      const domainKey = queryKeys.domain();
      await queryClient.cancelQueries({ queryKey: domainKey })
      const previous = queryClient.getQueryData<any[]>(domainKey)

      queryClient.setQueryData<any[]>(domainKey, (old) =>
        old?.filter((d) => d.id !== domainId)
      )

      return { previous }
    },

    onError: (_err, _domainId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.domain(), context.previous)
      }
    },

    onSuccess: (_data, deletedDomainId) => {
      // Agar jo domain delete hua, wahi abhi Redux mein selected tha —
      // toh selection clear karo, taaki domainSwitch.tsx ka auto-select
      // effect (jo "!domainId" check karta hai) naya valid domain le sake.
      if (deletedDomainId === currentDomainId) {
        dispatch(setDomainId(""));
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domain() })
    },
  })
}