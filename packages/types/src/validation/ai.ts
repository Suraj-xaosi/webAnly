import { z } from "zod"
import { ANALYTICS_DIMENSIONS, ANALYTICS_INTERVALS } from "../analytics.js"

const isoDateRangeSchema = z
  .object({
    from: z.iso.date().describe("Start date, format YYYY-MM-DD"),
    to: z.iso.date().describe("End date, format YYYY-MM-DD"),
  })
  .refine(({ from, to }) => from <= to, {
    message: "'from' must be before or equal to 'to'",
    path: ["to"],
  })

export const timeseriesToolInputSchema = z.object({
  from: z.string().describe("Start date, format YYYY-MM-DD"),
  to: z.string().describe("End date, format YYYY-MM-DD"),
})

export const pageMapToolInputSchema = isoDateRangeSchema

export const pageFlowToolInputSchema = isoDateRangeSchema.extend({
  page: z.string().min(1).describe("The exact page path to analyze"),
})

export const dimensionToolInputSchema = z.object({
  dimension: z
    .enum(ANALYTICS_DIMENSIONS)
    .describe("The dimension to break down"),
  from: z.string().describe("Start date, format YYYY-MM-DD"),
  to: z.string().describe("End date, format YYYY-MM-DD"),
})

export const dimensionTimeseriesToolInputSchema = isoDateRangeSchema.extend({
  dimension: z
    .enum(ANALYTICS_DIMENSIONS)
    .describe("The dimension containing the value"),
  value: z
    .string()
    .min(1)
    .describe("The exact value to trend within the selected dimension"),
  interval: z
    .enum(ANALYTICS_INTERVALS)
    .optional()
    .describe("Optional bucket interval: hour, dayname, day, week, or month"),
})

export const exitPagesToolInputSchema = z.object({
  from: z.string().describe("Start date, format YYYY-MM-DD"),
  to: z.string().describe("End date, format YYYY-MM-DD"),
})

export const analyticsClassifierSchema = z.object({
  isAnalyticsRelated: z
    .boolean()
    .describe(
      "True if the question is about website analytics data such as traffic, visitors, page views, browsers, devices, countries, referrers, trends, or exit pages. False if it is about coding, essays, recipes, or anything else."
    ),
})
