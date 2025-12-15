import { Kafka } from "kafkajs";
import dotenv from "dotenv";
import { prisma } from "@repo/db";

dotenv.config();

const kafka = new Kafka({
  clientId: process.env.KAFKA_CLIENT_ID_WORKER || "worker",
  brokers: process.env.KAFKA_BROKERS?.split(",") || ["localhost:9092"],
});

const consumer = kafka.consumer({
  groupId: process.env.KAFKA_GROUP_ID || "event-processors",
});

function getHourBucket(date: Date) {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d;
}

function getDayBucket(date: Date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function run() {
  await consumer.connect();
  await consumer.subscribe({
    topic: process.env.TOPIC_NAME || "site-events",
    fromBeginning: false,
  });

  console.log("✅ Kafka worker running");

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      let eventData: any;
      try {
        const parsed = JSON.parse(message.value.toString());
        eventData = parsed.eventData || parsed;
      } catch (err) {
        console.error("❌ Invalid JSON message");
        return;
      }

      if (!eventData.siteId || !eventData.visitorId || !eventData.page) {
        console.warn("⚠ Invalid event payload", eventData);
        return;
      }

      const eventDate = eventData.date
        ? new Date(eventData.date)
        : new Date();

      const hour = getHourBucket(eventDate);
      const day = getDayBucket(eventDate);

      try {
        /* ======================
           1. RAW EVENT (ALWAYS)
           ====================== */
        await prisma.dailyStat.create({
          data: {
            siteId: eventData.siteId,
            visitorId: eventData.visitorId,
            eventType: eventData.eventType || "pageview",
            date: eventDate,
            page: eventData.page,
            pageTitle: eventData.pageTitle || null,
            previousPage: eventData.previousPage || null,
            country: eventData.country || null,
            browser: eventData.browser || null,
            device: eventData.device || null,
            os: eventData.os || null,
            TimeSpent: eventData.timeSpent || null,
            IpAddress: eventData.ipAddress || null,
          },
        });
        console.log("✅ Raw event stored");

        /* ======================
           2. HOURLY VIEWS
           ====================== */
        await prisma.hourlySiteStat.upsert({
          where: {
            siteId_hour: {
              siteId: eventData.siteId,
              hour,
            },
          },
          update: {
            views: { increment: 1 },
          },
          create: {
            siteId: eventData.siteId,
            hour,
            views: 1,
            visitors: 0,
          },
        });
          console.log("✅ Hourly views updated");
        /* ======================
           3. UNIQUE VISITOR / HOUR
           ====================== */
        try {
          await prisma.hourlyVisitor.create({
            data: {
              siteId: eventData.siteId,
              hour,
              visitorId: eventData.visitorId,
            },
          });
          console.log("✅ New visitor for the hour");
          await prisma.hourlySiteStat.update({
            where: {
              siteId_hour: {
                siteId: eventData.siteId,
                hour,
              },
            },
            data: {
              visitors: { increment: 1 },
            },
          });
        } catch {
          console.log("ℹ️ something happend while updating hourly visitors");
          // visitor already counted for this hour → ignore
        }
        console.log("✅ Hourly unique visitors updated");

        /* ======================
           4. DAILY BREAKDOWNS
           ====================== */
        const breakdowns = [
          { type: "browser", key: eventData.browser },
          { type: "country", key: eventData.country },
          { type: "device", key: eventData.device },
          { type: "os", key: eventData.os },
          { type: "page", key: eventData.page },
        ];

        for (const b of breakdowns) {
          if (!b.key) continue;

          await prisma.dailyBreakdown.upsert({
            where: {
              siteId_date_type_key: {
                siteId: eventData.siteId,
                date: day,
                type: b.type,
                key: b.key,
              },
            },
            update: {
              views: { increment: 1 },
            },
            create: {
              siteId: eventData.siteId,
              date: day,
              type: b.type,
              key: b.key,
              views: 1,
            },
          });
        }
        console.log("✅ Processed event", { siteId: eventData.siteId, visitorId: eventData.visitorId });

      } catch (err) {
        console.error("❌ Failed to process event", err);
      }
    },
  });
}

run().catch((err) => {
  console.error("❌ Worker crashed", err);
});
