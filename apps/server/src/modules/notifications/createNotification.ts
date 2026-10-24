import { prisma, type NotificationType } from "@repo/db";

export type NotificationEvent = {
  domainId: string;
  type: NotificationType;
  visitorCountIn5min?: number;
  expectedVisitors?: number;
  difference?: number;
  spikeDate?: string;
  endsAt?: string;
};

function buildContent(domainName: string, event: NotificationEvent) {
  const endsAt = event.endsAt ? new Date(event.endsAt) : null;
  const readableEndDate = endsAt?.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  switch (event.type) {
    case "SPIKE_ALERT":
      return {
        title: `🚨 Traffic spike on ${domainName}`,
        message: `Got ${event.visitorCountIn5min} visitors, above the expected ${event.expectedVisitors}.`,
        data: {
          visitorCountIn5min: event.visitorCountIn5min ?? null,
          expectedVisitors: event.expectedVisitors ?? null,
          difference: event.difference ?? null,
          spikeDate: event.spikeDate ?? new Date().toISOString(),
        },
      };
    case "DOMAIN_EXPIRING":
      return {
        title: `⏳ ${domainName} is expiring soon`,
        message: `This domain's plan ends on ${readableEndDate ?? "soon"}. Extend or reactivate to keep tracking running.`,
        data: { endsAt: endsAt?.toISOString() ?? null },
      };
    case "DOMAIN_EXPIRED":
      return {
        title: `🔒 ${domainName} has been deactivated`,
        message: "This domain's plan expired and event collection has stopped. Reactivate to resume tracking.",
        data: { endsAt: endsAt?.toISOString() ?? null },
      };
    case "BILLING":
    case "SYSTEM":
      return {
        title: `Notification for ${domainName}`,
        message: `You have a new ${event.type.toLowerCase().replace(/_/g, " ")} notification.`,
        data: {},
      };
  }
}

export async function createNotification(event: NotificationEvent): Promise<void> {
  const domain = await prisma.domain.findUnique({
    where: { id: event.domainId },
    select: { userId: true, domainName: true },
  });

  if (!domain) {
    console.warn(`NOTIFICATION: Domain not found: ${event.domainId}`);
    return;
  }

  const content = buildContent(domain.domainName, event);
  await prisma.notification.create({
    data: {
      userId: domain.userId,
      type: event.type,
      title: content.title,
      message: content.message,
      data: {
        domainId: event.domainId,
        domainName: domain.domainName,
        ...content.data,
      },
    },
  });
}
