import type { TimeseriesPoint } from "@/lib/shared/types/analytics";

export function getHourBucketLabel(dateValue: string | number, timezone: string): string {
  const date = new Date(dateValue);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hourCycle: "h23",
    hour: "numeric",
  }).formatToParts(date);

  const hourPart = parts.find((part) => part.type === "hour");
  const hour24 = hourPart ? parseInt(hourPart.value, 10) : date.getUTCHours();
  const period = hour24 >= 12 ? "pm" : "am";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}${period}`;
}

export function mergeHourlyPoint(
  points: TimeseriesPoint[],
  label: string,
  isNewVisitor: boolean,
  sortByHour = false
): TimeseriesPoint[] {
  const existingIndex = points.findIndex((point) => point.date === label);
  const nextPoints = [...points];

  if (existingIndex !== -1) {
    const existingPoint = nextPoints[existingIndex]!;
    nextPoints[existingIndex] = {
      ...existingPoint,
      views: existingPoint.views + 1,
      visitors: existingPoint.visitors + (isNewVisitor ? 1 : 0),
    };
  } else {
    nextPoints.push({
      date: label,
      views: 1,
      visitors: isNewVisitor ? 1 : 0,
    });
  }

  return sortByHour ? nextPoints.sort((a, b) => parseHourLabel(a.date) - parseHourLabel(b.date)) : nextPoints;
}

function parseHourLabel(label: string): number {
  const period = label.slice(-2);
  const hour12 = parseInt(label, 10);

  if (period === "am") return hour12 === 12 ? 0 : hour12;
  return hour12 === 12 ? 12 : hour12 + 12;
}
