export const queryKeys = {
  domain: () => ["domain"] as const,
  apikey: (domainId: string) => ["apikey", domainId] as const,
  notifications: () => ["notifications"] as const,
  analytics: {
    dimension: (
      domainId: string,
      from: string,
      to: string,
      dimension: string,
      limit?: number,
      timezone?: string
    ) => ["dimension", domainId, from, to, dimension, limit ?? 100, timezone] as const,
    exitPages: (domainId: string, from: string, to: string, limit?: number) =>
      ["exit-pages", domainId, from, to, limit ?? 100] as const,
    timeseries: (
      domainId: string,
      from: string,
      to: string,
      interval?: string,
      timezone?: string
    ) => ["timeseries", domainId, from, to, interval ?? "hour", timezone] as const,
  },
} as const;
