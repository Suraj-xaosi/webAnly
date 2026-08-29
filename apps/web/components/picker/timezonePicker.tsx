"use client";

import { Clock3 } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectTimezone, setDateRange, setTimezone } from "@/store/slices/dashboardSlice";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { format, subDays } from "date-fns";
import { useEffect, useMemo } from "react";


const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Australia/Sydney",
];

export function getTimezoneOptions() {
  const seen = new Set<string>(COMMON_TIMEZONES);

  if (typeof Intl !== "undefined" && typeof Intl.supportedValuesOf === "function") {
    const browserTimezones = Intl.supportedValuesOf("timeZone") as string[];
    browserTimezones.forEach((timezone) => seen.add(timezone));
  }

  return Array.from(seen).sort((a, b) => {
    if (a === "UTC") return -1;
    if (b === "UTC") return 1;
    return a.localeCompare(b);
  });
}

export function getBrowserTimezone() {
  if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function") {
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (browserTimezone) {
      return browserTimezone;
    }
  }

  return "UTC";
}

export default function TimezonePicker() {
  const dispatch = useAppDispatch();
  const timezone = useAppSelector(selectTimezone) ?? "UTC";
  const options = useMemo(() => getTimezoneOptions(), []);

useEffect(() => {
  const browserTimezone = getBrowserTimezone();
  if (!timezone || timezone === "UTC") {
    dispatch(setTimezone(browserTimezone));

    if (browserTimezone !== "UTC") {
      const zonedTodayStr = new Intl.DateTimeFormat("en-CA", { timeZone: browserTimezone }).format(new Date());
      const zonedToday = new Date(zonedTodayStr);
      dispatch(setDateRange({
        from: format(subDays(zonedToday, 27), "yyyy-MM-dd"),
        to: zonedTodayStr,
        interval: "day",
      }));
    }
  }
}, [dispatch, timezone]);

  return (
    <div className="flex items-center gap-2">
      <Select value={timezone} onValueChange={(value) => dispatch(setTimezone(value))}>
        <SelectTrigger className="w-[220px]">
          <Clock3 className="size-4 text-muted-foreground" />
          <SelectValue placeholder="Select timezone" />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
