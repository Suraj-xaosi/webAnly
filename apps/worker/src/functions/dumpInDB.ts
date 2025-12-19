import prisma from '@repo/db';
import { getHourBucket,getDayBucket } from './timeBuckets.js';

type eventData = {
	siteId: string;
	visitorId: string;
	page: string;
	eventType?: string;
	date?: Date;
	pageTitle?: string;
	previousPage?: string;
	country?: string;
	browser?: string;
	device?: string;
	os?: string;
	timeSpent?: number;
	ipAddress?: string;
};

export default async function dumpInDB(eventData: eventData) {
	const eventDate = eventData.date ? new Date(eventData.date) : new Date();
	const hour = getHourBucket(eventDate);
	const day = getDayBucket(eventDate);
	try {
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

		// Check if visitor already exists for this hour
		const existed = await prisma.hourlyVisitor.findUnique({
			where: {
				siteId_hour_visitorId: {
					siteId: eventData.siteId,
					hour,
					visitorId: eventData.visitorId,
				},
			},
		});
		await prisma.hourlyVisitor.upsert({
			where: {
				siteId_hour_visitorId: {
					siteId: eventData.siteId,
					hour,
					visitorId: eventData.visitorId,
				},
			},
			create: {
				siteId: eventData.siteId,
				hour,
				visitorId: eventData.visitorId,
			},
			update: {}, // do nothing if already exists
		});
		// If existed is null before upsert, this is a new visitor
		if (!existed) {
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
			console.log("✅ Hourly unique visitors updated");
		}

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
}