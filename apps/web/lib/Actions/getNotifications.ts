"use server"

import { prisma } from "@repo/db";
import { requireSession } from "./requireSession";

export async function getNotifications() {
  try {
    const { session, error } = await requireSession("You must be logged in to see your api key.")
    if (error) return { error }

    const notifications = await prisma.notification.findMany({
      where: { userId: session?.user.id },
      orderBy: { date: "desc" },
      take: 30,
    });

    return { notifications };
  } catch (err: any) {
    console.error("getNotifications ERROR:", err);
    return { error: "Something went wrong while getting notifications." };
  }
}

export async function markNotificationRead(id: string) {
  try {
    const { session, error } = await requireSession("You must be logged in to see your api key.")
    if (error) return { error }

    // scoped to userId so you can't mark someone else's notification read by guessing an id
    await prisma.notification.updateMany({
      where: { id, userId: session?.user.id },
      data: { read: true },
    });

    return { success: true };
  } catch (err: any) {
    console.error("markNotificationRead ERROR:", err);
    return { error: "Something went wrong while updating the notification." };
  }
}

export async function markAllNotificationsRead() {
  try {
    const { session, error } = await requireSession("You must be logged in to see your api key.")
    if (error) return { error }

    await prisma.notification.updateMany({
      where: { userId: session?.user.id, read: false },
      data: { read: true },
    });

    return { success: true };
  } catch (err: any) {
    console.error("markAllNotificationsRead ERROR:", err);
    return { error: "Something went wrong while updating notifications." };
  }
}