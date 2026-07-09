// src/config/kafka.ts
// Centralized Kafka topic configuration

export const KAFKA_TOPICS = {
  // Main event stream from collector
  SITE_EVENTS: process.env.TOPIC_NAME || "domain.events",

  // Real-time event broadcasting for websockets
  SOCKET_EVENTS: process.env.SOCKET_TOPIC_NAME || "socket.site-events",

  // Spike alert notifications
  NOTIFICATIONS: process.env.TOPIC_NAME_NOTIFICATIONS || "notifications",

  // Domain activity tracking for spike detection
  DOMAIN_ACTIVITY: process.env.DOMAIN_ACTIVITY_TOPIC || "domain.activity",
} as const;

export const KAFKA_GROUPS = {
  ANALYTICS_WORKERS: process.env.KAFKA_GROUP_ID || "db.dumpers",
  NOTIFICATION_WORKERS: process.env.KAFKA_GROUP_ID_WORKER2 || "notification.workers",
  WEBSOCKET_CONSUMERS: "collector.websocket.consumers",
  SPIKE_DETECTORS: "spike.detection.group",
} as const;
