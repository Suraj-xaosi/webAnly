
import { useQuery } from "@tanstack/react-query";
import { getApikey } from "@/lib/Actions/getApikey";

export function useApiKey(domainId: string) {
  return useQuery({
    queryKey: ["apikey", domainId],
    queryFn: async () => {
      const result = await getApikey(domainId);
      if (result.error) throw new Error(result.error);
      return result.apikey;
    },
    enabled: !!domainId,
    staleTime: Infinity,   
    gcTime: 0,            
  });
}