// Centralized Kafka topic configuration

export const KAFKA_TOPICS = {
  // Main event stream from collector
  SITE_EVENTS: process.env.TOPIC_NAME || "domain.events",

  // Real-time event broadcasting for websockets
  SOCKET_EVENTS: process.env.SOCKET_TOPIC_NAME || "socket.site-events",

  // Spike alert notifications
  NOTIFICATIONS: process.env.TOPIC_NAME_NOTIFICATIONS || "notifications",
} as const;

export const KAFKA_GROUPS = {
  ANALYTICS_WORKERS: process.env.KAFKA_GROUP_ID || "db.dumpers",
  NOTIFICATION_WORKERS: process.env.KAFKA_GROUP_ID_WORKER2 || "notification.workers",
  WEBSOCKET_CONSUMERS: "collector.websocket.consumers",
} as const;