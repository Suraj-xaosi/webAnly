// web/components/notifications/NotificationList.tsx
"use client";

import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import { NotificationItem } from "./notificationItem";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

export function NotificationList() {
  const { data: notifications, isLoading, error } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const allNotifications = notifications ?? [];
  const unreadNotifications = allNotifications.filter((n) => !n.read);
  const unreadCount = unreadNotifications.length;

  return (
    <Card className="w-full overflow-hidden border-0 bg-background shadow-none">
      <CardHeader className="flex items-center justify-between border-b p-3">
        <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
        {unreadCount > 0 && (
          <CardAction>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => markAllAsRead.mutate()}
            >
              Mark all as read
            </Button>
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96 overflow-hidden">
          <CardContent className="space-y-1 p-2">
            {isLoading && (
              <CardDescription className="p-3 text-sm text-muted-foreground">
                Loading...
              </CardDescription>
            )}
            {error && (
              <CardDescription className="p-3 text-sm text-destructive">
                {error.message}
              </CardDescription>
            )}
            {!isLoading && unreadNotifications.length === 0 && (
              <CardDescription className="p-3 text-sm text-muted-foreground">
                You&apos;re all caught up.
              </CardDescription>
            )}
            {unreadNotifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onRead={(id) => markAsRead.mutate(id)}
              />
            ))}
          </CardContent>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}