import prisma from '@repo/db';
import countryFromIp from './countryfromip.js';
import { createHash } from 'crypto';

function hashVisitorId(visitorId: string): string {
	return createHash('sha256').update(visitorId).digest('hex');
}


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
	
};

export default async function dumpInDB(eventData: eventData) {
	const eventDate = eventData.date ? new Date(eventData.date) : new Date();
	try{

		if(eventData.visitorId){
			eventData.country=await countryFromIp(eventData.visitorId);
		}else{
			eventData.country="unknown"
		}
		

	}catch(err){
		eventData.country="unknown"
		console.log(err);
	}
	// visitor id hash should be below this line.
	try {
		await prisma.dailyStat.create({
			data: {
				siteId: eventData.siteId,
				visitorId: hashVisitorId(eventData.visitorId),
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
			},
		});
		console.log("✅ Raw event stored");

		console.log("✅ Processed event", { siteId: eventData.siteId, visitorId: eventData.visitorId });
	} catch (err) {
		console.error("❌ Failed to process event", err);
	}
}