import { z } from "zod"

const visitorIdSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  )

export const collectorEventSchema = z
  .object({
    apikey: z.string().trim().min(1),
    page: z.string().min(1),
    visitorId: visitorIdSchema,
    pageTitle: z.string().nullable().optional(),
    referrer: z.string().nullable().optional(),
    previousPage: z.string().nullable().optional(),
    browser: z.string().optional(),
    device: z.string().optional(),
    os: z.string().optional(),
    timezone: z.string().optional(),
    visitedAt: z.union([z.string(), z.number()]).optional(),
    timeSpent: z.union([z.string(), z.number()]).optional(),
    exitType: z.string().optional(),
  })
  .passthrough()

export type CollectorEventInput = z.infer<typeof collectorEventSchema>
