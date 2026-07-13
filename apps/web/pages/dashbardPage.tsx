// web/pages/dashboardPage.tsx
"use client"

import { format } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDomainId, selectFrom, selectTo, setDateRange } from "@/store/slices/dashboardSlice";
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

const DIMENSIONS: Dimension[] = ["browser", "country", "device", "os", "referrer", "page"];

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const domainId = useAppSelector(selectDomainId);
  const from = useAppSelector(selectFrom);
  const to = useAppSelector(selectTo);

  const timeseries = useTimeseries({ domainId, from, to });

  const browser = useDimension({ domainId, from, to, dimension: "browser" });
  const country = useDimension({ domainId, from, to, dimension: "country" });
  const device = useDimension({ domainId, from, to, dimension: "device" });
  const os = useDimension({ domainId, from, to, dimension: "os" });
  const referrer = useDimension({ domainId, from, to, dimension: "referrer" });
  const page = useDimension({ domainId, from, to, dimension: "page" });

  const dimensionMap = { browser, country, device, os, referrer, page };

  return (
    <div className="grid gap-6">

      <div className="flex items-center justify-between gap-4">
        <div className="w-fit">
          <DomainSwitch />
        </div>
        <DateRangePicker
          value={{ from: new Date(from), to: new Date(to) }}
          onApply={(range) => {
            if (range.from && range.to) {
              dispatch(setDateRange({
                from: format(range.from, "yyyy-MM-dd"),
                to:   format(range.to, "yyyy-MM-dd"),
              }));
            }
          }}
        />
      </div>

      <TimeseriesCard
        data={timeseries.data?.data ?? []}
        isLoading={timeseries.isLoading}
        isError={timeseries.isError}
        error={timeseries.error}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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