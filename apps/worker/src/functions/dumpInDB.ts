import prisma from '@repo/db';
import countryFromIp from './countryfromip';


type eventData = {
	siteId: string;
	visitorId: string;
	page: string;
	eventType?: string;
	date?: Date;
	ip?:string;
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

		if(eventData.ip){
			eventData.country=await countryFromIp(eventData.ip);
		}else{
			eventData.country="unknown"
		}
		

	}catch(err){
		eventData.country="unknown"
		console.log(err);
	}
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
			},
		});
		console.log("✅ Raw event stored");

		console.log("✅ Processed event", { siteId: eventData.siteId, visitorId: eventData.visitorId });
	} catch (err) {
		console.error("❌ Failed to process event", err);
	}
}