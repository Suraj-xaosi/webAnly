// web/components/notifications/NotificationItem.tsx
"use client";

import { AlertTriangle, Info, Receipt, Bell } from "lucide-react";
import type { KeyboardEvent } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Card, CardContent, CardDescription, CardTitle } from "@workspace/ui/components/card";

const ICONS: Record<string, React.ElementType> = {
  SPIKE_ALERT: AlertTriangle,
  WEEKLY_REPORT: Info,
  BILLING: Receipt,
  SYSTEM: Bell,
};

function timeAgo(date: string | Date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationItem({
  notification,
  onRead,
}: {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    date: string | Date;
    read: boolean;
  };
  onRead: (id: string) => void;
}) {
  const Icon = ICONS[notification.type] ?? Bell;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === "Enter" || event.key === " ") && !notification.read) {
      event.preventDefault();
      onRead(notification.id);
    }
  };

  return (
    <Card
      size="sm"
      role="button"
      tabIndex={0}
      onClick={() => !notification.read && onRead(notification.id)}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex w-full cursor-pointer items-start gap-3 overflow-hidden rounded-md border-0 bg-transparent py-3 shadow-none transition-colors hover:bg-muted",
        !notification.read && "bg-muted/50"
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <CardContent className="flex-1 space-y-1 p-0">
        <CardTitle className={cn("text-sm", !notification.read && "font-semibold")}>
          {notification.title}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {notification.message}
        </CardDescription>
        <CardDescription className="text-xs text-muted-foreground">
          {timeAgo(notification.date)}
        </CardDescription>
      </CardContent>
      {!notification.read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </Card>
  );
}