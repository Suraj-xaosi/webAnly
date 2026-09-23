import { createOrder } from "@/lib/Actions/createOrder"
import { useApiMutation } from "@/lib/shared/tanstackFunctions/api"

export function useCreateOrder() {
  return useApiMutation({
    mutationFn: async (domainId: string) => {
      const result = await createOrder(domainId)
      if (!result.success) throw new Error(result.error)
      return result.data
    },
  })
}