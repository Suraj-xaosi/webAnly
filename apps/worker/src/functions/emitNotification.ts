import { Kafka, Producer } from "kafkajs";
import dotenv from "dotenv";
dotenv.config();

type EmitNotification = {
    siteId: string;
    viewsIn5min: number;
    expectedViews: number;
    difference: number;
};


const kafka = new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID_PRODUCER || "",
    brokers: (process.env.KAFKA_BROKERS || "").split(",").map(b => b.trim()).filter(Boolean),
});

const producer: Producer = kafka.producer({
    allowAutoTopicCreation: false,
});

let isConnected = false;

export default async function emitNotification(notification: EmitNotification) {
    if (!notification.siteId) {
        console.error("❌ Missing siteId in notification");
        return;
    }

    const TOPIC_NAME = process.env.TOPIC_NAME_NOTIFICATIONS || "";

    try {
       
        if (!isConnected) {
            await producer.connect();
            isConnected = true;
        }

        await producer.send({
            topic: TOPIC_NAME,
            messages: [
                {
                    key: notification.siteId,
                    value: JSON.stringify(notification),
                }
            ]
        });

        console.log(`🚨 Site ${notification.siteId} crossed expected views! (${notification.viewsIn5min}/${notification.expectedViews}) Difference: ${notification.difference}`);

    } catch (error) {
        console.error("❌ Failed to emit notification:", error);
        isConnected = false; //  force reconnect on next call if something went wrong
    }
}