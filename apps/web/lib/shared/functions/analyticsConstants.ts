export const VALID_INTERVALS = ["hour", "dayname", "day", "week", "month"] as const;
export type Interval = (typeof VALID_INTERVALS)[number];

export const TRUNC_FOR: Record<Exclude<Interval, "week">, string> = {
  hour: "hour",
  dayname: "day",
  day: "day",
  month: "month",
};

export const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

export const DAY_NAMES = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

export const DIMENSION_COL_MAP: Record<string, string> = {
  page: "page",
  browser: "browser",
  device: "device",
  country: "country",
  city: "city",
  os: "os",
  referrer: "referrer",
};
