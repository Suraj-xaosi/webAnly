// web/pages/LiveDashboardPage.tsx
"use client"

import { format } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDomainId, selectFrom, selectTo, setDateRange } from "@/store/slices/dashboardSlice";
import { useRealtimeTimeseries } from "@/hooks/useRealtimeTimeseries";
import { useRealtimeDimension }  from "@/hooks/useRealtimeDimension";
import { TimeseriesCard }        from "@/components/timeseriesCard";
import { DimensionCard }         from "@/components/dimensionCard";
import { DateRangePicker }       from "@workspace/ui/components/main/dateRangePicker";
import DomainSwitch              from "@/components/domainSwitch";
import { useApiKey }             from "@/hooks/useApikey";
import type { Dimension }        from "@/hooks/useDimension";

const DIMENSIONS: Dimension[] = ["browser", "country", "device", "os", "referrer", "page"];

export default function liveDashboardPage() {
  const dispatch = useAppDispatch();
  const domainId = useAppSelector(selectDomainId);
  const from     = useAppSelector(selectFrom);
  const to       = useAppSelector(selectTo);

  const { data: apikey, isPending: apikeyLoading } = useApiKey(domainId);
  const enabled = !!apikey && !apikeyLoading;

  const timeseries = useRealtimeTimeseries(domainId, from, to, apikey ?? "", enabled);

  const browser  = useRealtimeDimension("browser",  domainId, from, to, apikey ?? "", enabled);
  const country  = useRealtimeDimension("country",  domainId, from, to, apikey ?? "", enabled);
  const device   = useRealtimeDimension("device",   domainId, from, to, apikey ?? "", enabled);
  const os       = useRealtimeDimension("os",       domainId, from, to, apikey ?? "", enabled);
  const referrer = useRealtimeDimension("referrer", domainId, from, to, apikey ?? "", enabled);
  const page     = useRealtimeDimension("page",     domainId, from, to, apikey ?? "", enabled);

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

      {!domainId ? (
        <div className="p-6 text-muted-foreground">Select a domain to view live data...</div>
      ) : apikeyLoading ? (
        <div className="p-6 text-muted-foreground">Connecting to live dashboard...</div>
      ) : (
        <>
          <TimeseriesCard
            data={timeseries.data}
            isLoading={timeseries.isLoading}
            isError={timeseries.isError}
            error={timeseries.error}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DIMENSIONS.map((dimension) => {
              const result = dimensionMap[dimension];
              return (
                <DimensionCard
                  key={dimension}
                  dimension={dimension}
                  data={result.data}
                  isLoading={result.isLoading}
                  isError={result.isError}
                  error={result.error}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}