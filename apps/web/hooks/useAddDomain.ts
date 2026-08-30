import { useQueryClient } from "@tanstack/react-query"
import { setDomain } from "@/lib/Actions/setDomain"
import { useApiMutation } from "@/lib/shared/tanstackFunctions/api"
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys"

export function useAddDomain() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: async (vars: { domainName: string; expectedVisitors: number; defaultTimezone: string }) => {
      const result = await setDomain(vars.domainName, vars.expectedVisitors, vars.defaultTimezone);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },

    onMutate: async (vars) => {
      const domainKey = queryKeys.domain();
      await queryClient.cancelQueries({ queryKey: domainKey });
      const previous = queryClient.getQueryData<any[]>(domainKey);

      // Temporary optimistic entry — "optimistic-" prefix se pehchan
      // lete hain taaki baad mein filter kar sakein agar zaroorat pade
      const optimisticDomain = {
        id: `optimistic-${Date.now()}`,
        domainName: vars.domainName,
        apikey: "generating...",
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<any[]>(domainKey, (old) => [
        ...(old ?? []),
        optimisticDomain,
      ]);

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.domain(), context.previous);
      }
    },

    onSettled: () => {
      // Yahan REAL invalidate zaroori hai — kyunki optimistic entry ka
      // apikey "generating..." tha, asli data yahi se aayega
      queryClient.invalidateQueries({ queryKey: queryKeys.domain() });
    },
  });
}