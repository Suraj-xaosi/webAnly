"use client"

import { useState, useEffect, useMemo } from "react"
import { format, subDays, startOfWeek, startOfMonth, startOfYear,
         endOfMonth, subMonths } from "date-fns"
import { DateRange } from "react-day-picker"
import { Calendar } from "@workspace/ui/components/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Button } from "@workspace/ui/components/button"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

export function getZonedToday(timeZone: string): Date {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value])
  );

  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
}

export type Interval = "hour" | "dayname" | "day" | "week" | "month"

const DEFAULT_INTERVAL: Interval = "day" // matches "Last 28 Days" default

interface DateRangePickerProps {
  /** Externally-controlled applied range (e.g. from Redux). If omitted, component manages its own state. */
  value?: DateRange
  /** Fired when the user clicks "Apply" with the newly chosen range and its resolved interval. */
  onApply?: (range: DateRange, interval: Interval) => void
  timezone?: string
}

export function DateRangePicker({ value, onApply, timezone = "UTC" }: DateRangePickerProps) {
  const today = useMemo(() => getZonedToday(timezone), [timezone]);

  const PRESETS = useMemo(() => [
    { label: "Today",        interval: "hour" as Interval,    getRange: () => ({ from: today, to: today }) },
    { label: "Yesterday",    interval: "hour" as Interval,    getRange: () => { const y = subDays(today, 1); return { from: y, to: y } } },
    { label: "This Week",    interval: "dayname" as Interval, getRange: () => ({ from: startOfWeek(today), to: today }) },
    { label: "Last 7 Days",  interval: "day" as Interval,     getRange: () => ({ from: subDays(today, 6), to: today }) },
    { label: "Last 28 Days", interval: "day" as Interval,     getRange: () => ({ from: subDays(today, 27), to: today }) },
    { label: "This Month",   interval: "week" as Interval,    getRange: () => ({ from: startOfMonth(today), to: today }) },
    { label: "Last Month",   interval: "day" as Interval,     getRange: () => ({ from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) }) },
    { label: "This Year",    interval: "month" as Interval,   getRange: () => ({ from: startOfYear(today), to: today }) },
  ], [today]);

  const DEFAULT_RANGE: DateRange = useMemo(
    () => ({ from: subDays(today, 27), to: today }),
    [today]
  );

  const [open, setOpen] = useState(false)
  const [internalApplied, setInternalApplied] = useState<DateRange>(value ?? DEFAULT_RANGE)
  const [tmp, setTmp] = useState<DateRange>(value ?? DEFAULT_RANGE)
  const [activePreset, setActivePreset] = useState("Last 28 Days")
  const [activeInterval, setActiveInterval] = useState<Interval>(DEFAULT_INTERVAL)

  // Keep internal state in sync if parent controls `value` and changes it externally
  useEffect(() => {
    if (value) {
      setInternalApplied(value)
    }
  }, [value]);

  const applied = value ?? internalApplied

  function handleOpen(val: boolean) {
    if (val) setTmp(applied)
    setOpen(val)
  }

  function handlePreset(preset: (typeof PRESETS)[0]) {
    setActivePreset(preset.label)
    setActiveInterval(preset.interval)
    setTmp(preset.getRange())
  }

  function handleCalendarSelect(r: DateRange) {
    setTmp(r)
    setActivePreset("")
    setActiveInterval(DEFAULT_INTERVAL) // manual drag always falls back to day+date
  }

  function handleApply() {
    if (!value) {
      // uncontrolled mode — manage our own applied state
      setInternalApplied(tmp)
    }
    onApply?.(tmp, activeInterval)
    setOpen(false)
  }

  const formatRange = (r: DateRange) =>
    r.from && r.to
      ? `${format(r.from, "dd MMM yyyy")} – ${format(r.to, "dd MMM yyyy")}`
      : r.from
      ? format(r.from, "dd MMM yyyy")
      : "Pick a date"

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="max-w-full min-w-0 gap-2 overflow-hidden font-heading">
          <CalendarIcon className="w-4 h-4 shrink-0" />
          <span className="truncate">{formatRange(applied)}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="max-h-[calc(100dvh-1rem)] max-w-[calc(100vw-1.5rem)] overflow-y-auto p-0"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="grid max-h-36 grid-cols-2 overflow-y-auto border-b py-2 sm:flex sm:max-h-none sm:min-w-[145px] sm:flex-col sm:border-b-0 sm:border-r sm:py-3">
            <p className="col-span-2 px-3 pb-2 text-[10px] uppercase tracking-widest text-muted-foreground sm:col-span-1 sm:px-4">
              Quick select
            </p>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePreset(p)}
                className={cn(
                  "border-l-2 px-3 py-1.5 text-left text-sm font-heading transition-all sm:px-4 sm:py-2",
                  activePreset === p.label
                    ? "bg-accent text-accent-foreground border-foreground"
                    : "text-muted-foreground border-transparent hover:bg-accent hover:text-accent-foreground hover:border-muted-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3 p-3 sm:p-4">
            <Calendar
              mode="range"
              selected={tmp}
              onSelect={(r) => {
                if (r) handleCalendarSelect(r)
              }}
              numberOfMonths={1}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <p className="text-xs font-heading text-muted-foreground">
                {tmp.from && tmp.to ? (
                  <>
                    <span className="text-foreground">{format(tmp.from, "dd MMM")}</span>
                    {" – "}
                    <span className="text-foreground">{format(tmp.to, "dd MMM yyyy")}</span>
                  </>
                ) : tmp.from ? (
                  <span className="text-foreground">{format(tmp.from, "dd MMM yyyy")}</span>
                ) : (
                  "Select a range"
                )}
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="text-xs" onClick={handleApply}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}