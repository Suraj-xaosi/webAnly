import { useQuery } from "@tanstack/react-query";
import { getDomain } from "@/lib/Actions/getDomain";

export function useDomain() {
  return useQuery({
    queryKey: ["domain"],
    queryFn: async () => {
      const result = await getDomain();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.domains;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
