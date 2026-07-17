// web/pages/dashboardPage.tsx
"use client"

import { format } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDomainId, selectFrom, selectTo, selectInterval, setDateRange,selectTimezone } from "@/store/slices/dashboardSlice";
import { useTimeseries } from "@/hooks/useTimeseries";
import { useDimension } from "@/hooks/useDimension";
import { TimeseriesCard } from "@/components/timeseriesCard";
import { DimensionCard } from "@/components/dimensionCard";
import { DateRangePicker } from "@workspace/ui/components/main/dateRangePicker";
import {
  Card,
  CardContent,
} from "@workspace/ui/components/card";
import DomainSwitch from "@/components/domainSwitch";
import type { Dimension } from "@/hooks/useDimension";
import { useExitPages } from "@/hooks/useExitPages";
import { ExitPageCard } from "@/components/exitPageCard";
import TimezonePicker from "@/components/timezonePicker";

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