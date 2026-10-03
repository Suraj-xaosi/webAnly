"use client"

import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "@/hooks/notification/useNotifications"
import { NotificationItem } from "./notificationItem"
import { ScrollArea } from "@workspace/ui/components/scroll-area"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

export function NotificationList() {
  const {
    data: notifications,
    isLoading,
    isError,
    error,
    refetch,
  } = useNotifications()
  const markAsRead = useMarkAsRead()
  const markAllAsRead = useMarkAllAsRead()

  const allNotifications = notifications ?? []
  const unreadNotifications = allNotifications.filter((n) => !n.read)
  const unreadCount = unreadNotifications.length
  const mutationError = markAsRead.error ?? markAllAsRead.error

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
              <div className="grid gap-3 p-3" role="status" aria-busy="true" aria-label="Loading notifications">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="grid gap-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                ))}
              </div>
            )}
            {isError && (
              <div className="grid gap-2 p-3" role="alert">
                <CardDescription className="text-sm text-destructive">
                  {notifications
                    ? `Could not refresh notifications: ${error.message}`
                    : error.message}
                </CardDescription>
                {!notifications && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => void refetch()}
                  >
                    Try again
                  </Button>
                )}
              </div>
            )}
            {mutationError && (
              <CardDescription
                className="p-3 text-sm text-destructive"
                role="alert"
              >
                {mutationError.message} Try again by selecting the notification
                again.
              </CardDescription>
            )}
            {!isLoading && !isError && unreadNotifications.length === 0 && (
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
  )
}
