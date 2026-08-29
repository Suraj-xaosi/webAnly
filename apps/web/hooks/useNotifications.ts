import { useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/Actions/getNotifications";
import { useApiMutation, useApiQuery } from "@/lib/shared/tanstackFunctions/api";
import { queryKeys } from "@/lib/shared/tanstackFunctions/queryKeys";

export function useNotifications() {
  return useApiQuery({
    queryKey: queryKeys.notifications(),
    queryFn: async () => {
      const result = await getNotifications();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.notifications ?? [];
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications() });
      const previous = queryClient.getQueryData<any[]>(queryKeys.notifications());

      queryClient.setQueryData<any[]>(queryKeys.notifications(), (old) =>
        old?.map((n) => (n.id === id ? { ...n, read: true } : n))
      );

      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useApiMutation({
    mutationFn: () => markAllNotificationsRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notifications() });
      const previous = queryClient.getQueryData<any[]>(queryKeys.notifications());

      queryClient.setQueryData<any[]>(queryKeys.notifications(), (old) =>
        old?.map((n) => ({ ...n, read: true }))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notifications(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() });
    },
  });
}