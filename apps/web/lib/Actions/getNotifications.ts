"use server"

import { prisma } from "@repo/db";
import { requireSession } from "./requireSession";
import { actionErr, actionOk } from "@/lib/shared/types/actionResult"

export async function getNotifications() {
  try {
    const sessionResult = await requireSession("You must be logged in to see your notifications.")
    if (!sessionResult.success) return actionErr(sessionResult.error)

    const notifications = await prisma.notification.findMany({
      where: { userId: sessionResult.data.user.id },
      orderBy: { date: "desc" },
      take: 30,
    });

    return actionOk(notifications)
  } catch (err: any) {
    console.error("getNotifications ERROR:", err);
    return actionErr("Something went wrong while getting notifications.")
  }
}

export async function markNotificationRead(id: string) {
  try {
    const sessionResult = await requireSession("You must be logged in to update notifications.")
    if (!sessionResult.success) return actionErr(sessionResult.error)

    await prisma.notification.updateMany({
      where: { id, userId: sessionResult.data.user.id },
      data: { read: true },
    });

    return actionOk(true)
  } catch (err: any) {
    console.error("markNotificationRead ERROR:", err);
    return actionErr("Something went wrong while updating the notification.")
  }
}

export async function markAllNotificationsRead() {
  try {
    const sessionResult = await requireSession("You must be logged in to update notifications.")
    if (!sessionResult.success) return actionErr(sessionResult.error)

    await prisma.notification.updateMany({
      where: { userId: sessionResult.data.user.id, read: false },
      data: { read: true },
    });

    return actionOk(true)
  } catch (err: any) {
    console.error("markAllNotificationsRead ERROR:", err);
    return actionErr("Something went wrong while updating notifications.")
  }
}