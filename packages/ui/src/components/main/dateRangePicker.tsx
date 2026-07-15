// components/DateRangePicker.tsx
"use client"

import { useState, useEffect } from "react"
import { format, subDays, startOfWeek, startOfMonth, startOfYear,
         endOfMonth, subMonths } from "date-fns"
import { DateRange } from "react-day-picker"
import { Calendar } from "@workspace/ui/components/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover"
import { Button } from "@workspace/ui/components/button"
import { CalendarIcon, ChevronDown } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"

const today = new Date()

export type Interval = "hour" | "dayname" | "day" | "week" | "month"

const PRESETS = [
  { label: "Today",        interval: "hour" as Interval,    getRange: () => ({ from: today, to: today }) },
  { label: "Yesterday",    interval: "hour" as Interval,    getRange: () => { const y = subDays(today, 1); return { from: y, to: y } } },
  { label: "This Week",    interval: "dayname" as Interval, getRange: () => ({ from: startOfWeek(today), to: today }) },
  { label: "Last 7 Days",  interval: "day" as Interval,     getRange: () => ({ from: subDays(today, 6), to: today }) },
  { label: "Last 28 Days", interval: "day" as Interval,     getRange: () => ({ from: subDays(today, 27), to: today }) },
  { label: "This Month",   interval: "week" as Interval,    getRange: () => ({ from: startOfMonth(today), to: today }) },
  { label: "Last Month",   interval: "day" as Interval,     getRange: () => ({ from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) }) },
  { label: "This Year",    interval: "month" as Interval,   getRange: () => ({ from: startOfYear(today), to: today }) },
]

const DEFAULT_RANGE: DateRange = {
  from: subDays(today, 27),
  to: today,
}
const DEFAULT_INTERVAL: Interval = "day" // matches "Last 28 Days" default

interface DateRangePickerProps {
  /** Externally-controlled applied range (e.g. from Redux). If omitted, component manages its own state. */
  value?: DateRange
  /** Fired when the user clicks "Apply" with the newly chosen range and its resolved interval. */
  onApply?: (range: DateRange, interval: Interval) => void
}

export function DateRangePicker({ value, onApply }: DateRangePickerProps) {
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
        <Button variant="outline" className="gap-2 font-heading">
          <CalendarIcon className="w-4 h-4" />
          {formatRange(applied)}
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-auto p-0">
        <div className="flex">
          {/* ── Presets sidebar ── */}
          <div className="flex flex-col py-3 border-r min-w-[145px]">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest px-4 pb-2">
              Quick select
            </p>
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => handlePreset(p)}
                className={cn(
                  "text-left px-4 py-2 text-sm font-heading transition-all border-l-2",
                  activePreset === p.label
                    ? "bg-accent text-accent-foreground border-foreground"
                    : "text-muted-foreground border-transparent hover:bg-accent hover:text-accent-foreground hover:border-muted-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* ── Calendar + footer ── */}
          <div className="p-4 flex flex-col gap-3">
            <Calendar
              mode="range"
              selected={tmp}
              onSelect={(r) => {
                if (r) handleCalendarSelect(r)
              }}
              numberOfMonths={1}
            />

            <div className="border-t pt-3 flex items-center justify-between gap-4">
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
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="text-xs"
                  onClick={handleApply}
                >
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