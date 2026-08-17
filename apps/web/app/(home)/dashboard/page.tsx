
"use client"

import { format } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDomainId, selectFrom, selectTo, selectInterval, setDateRange,selectTimezone } from "@/store/slices/dashboardSlice";
import { useTimeseries } from "@/hooks/analytics/useTimeseries";
import { useDimension } from "@/hooks/analytics/useDimension";
import { TimeseriesCard } from "@/components/dashCards/timeseriesCard";
import { DimensionCard } from "@/components/dashCards/dimensionCard";
import { DateRangePicker } from "@workspace/ui/components/main/dateRangePicker";
import {
  Card,
  CardContent,
} from "@workspace/ui/components/card";
import DomainSwitch from "@/components/picker/domainSwitch";
import type { Dimension } from "@/hooks/analytics/useDimension";
import { useExitPages } from "@/hooks/analytics/useExitPages";
import { ExitPageCard } from "@/components/dashCards/exitPageCard";
import TimezonePicker from "@/components/picker/timezonePicker";

const DIMENSIONS: Dimension[] = ["browser", "country", "device", "os", "referrer", "page"];

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const domainId = useAppSelector(selectDomainId);
  const from = useAppSelector(selectFrom);
  const to = useAppSelector(selectTo);
  const interval = useAppSelector(selectInterval);
  const timezone = useAppSelector(selectTimezone);

  const timeseries = useTimeseries({ domainId, from, to, interval, timezone });

  const browser = useDimension({ domainId, from, to, dimension: "browser", timezone });
  const country = useDimension({ domainId, from, to, dimension: "country", timezone });
  const device = useDimension({ domainId, from, to, dimension: "device", timezone });
  const os = useDimension({ domainId, from, to, dimension: "os", timezone });
  const referrer = useDimension({ domainId, from, to, dimension: "referrer", timezone });
  const page = useDimension({ domainId, from, to, dimension: "page", timezone });
  const exitPages = useExitPages({ domainId, from, to, timezone });


  const dimensionMap = { browser, country, device, os, referrer, page };

  const dataErrorMessage = [
    timeseries,
    exitPages,
    browser,
    country,
    device,
    os,
    referrer,
    page,
  ]
    .find((result) => result.isError && result.error)
    ?.error

  const errorMessage = dataErrorMessage
    ? typeof dataErrorMessage === "string"
      ? dataErrorMessage
      : dataErrorMessage.message ?? "Unable to load analytics data. Please try again."
    : null

  return (
    <div className="grid gap-6">

      <div className="flex items-center justify-between gap-4">
        <div className="w-fit">
          <DomainSwitch />
        </div>
        <DateRangePicker
          value={{ from: new Date(from), to: new Date(to) }}
          onApply={(range, interval) => {
            if (range.from && range.to) {
              dispatch(setDateRange({
                from:     format(range.from, "yyyy-MM-dd"),
                to:       format(range.to, "yyyy-MM-dd"),
                interval,
                
              }));
            }
          }}
        />

        <TimezonePicker />

      </div>

      {errorMessage ? (
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-base font-semibold">Data loading failed</p>
            <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
          </CardContent>
        </Card>
      ) : null}

      <TimeseriesCard
        data={timeseries.data?.data ?? []}
        isLoading={timeseries.isLoading}
        isError={timeseries.isError}
        error={timeseries.error}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ExitPageCard
          data={exitPages.data?.data ?? []}
          isLoading={exitPages.isLoading}
          isError={exitPages.isError}
          error={exitPages.error}
        />
        {DIMENSIONS.map((dimension) => {
          const result = dimensionMap[dimension];
          return (
            <DimensionCard
              key={dimension}
              dimension={dimension}
              data={result.data?.data ?? []}
              isLoading={result.isLoading}
              isError={result.isError}
              error={result.error}
            />
          );
        })}
      </div>
    </div>
  );
}