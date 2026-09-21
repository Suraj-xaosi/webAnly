"use client"

import { AnalyticsChatLauncher } from "@/components/ai/analyticsChatLauncher"
import { format } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectDomainId, selectFrom, selectTo, selectInterval, setDateRange,selectTimezone } from "@/store/slices/dashboardSlice";
import { TimeseriesCard } from "@/components/dashCards/timeseriesCard";
import { DimensionCard } from "@/components/dashCards/dimensionCard";
import { DateRangePicker } from "@workspace/ui/components/main/dateRangePicker";
import {
  Card,
  CardContent,
} from "@workspace/ui/components/card";
import DomainSwitch from "@/components/picker/domainSwitch";
import { ExitPageCard } from "@/components/dashCards/exitPageCard";
import TimezonePicker from "@/components/picker/timezonePicker";
import { DimensionDrilldownPopup } from "@/components/dashCards/dimensionDrilldownPopup";
import { closeDrilldown, selectActiveDrilldown } from "@/store/slices/drilldownSlice";
import { PageFlowCard } from "@/components/dashCards/pageFlowCard";
import { useDashboardAnalytics } from "@/hooks/analytics/useDashboardAnalytics";
import { useEffect, useTransition } from "react";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const [isPending, startTransition] = useTransition();
  const activeDrilldown = useAppSelector(selectActiveDrilldown);
  const domainId = useAppSelector(selectDomainId);
  const from = useAppSelector(selectFrom);
  const to = useAppSelector(selectTo);
  const interval = useAppSelector(selectInterval);
  const timezone = useAppSelector(selectTimezone);

  useEffect(() => {
    dispatch(closeDrilldown());
  }, [dispatch, domainId]);

  const analytics = useDashboardAnalytics({ domainId, from, to, interval, timezone })

  const errorMessage = analytics.dataError
    ? typeof analytics.dataError === "string"
      ? analytics.dataError
      : analytics.dataError.message ?? "Unable to load analytics data. Please try again."
    : null

  return (
    <div className="grid gap-6">

      <div className="flex items-center justify-between gap-4">
        <div className="flex w-fit items-center gap-2">
          <DomainSwitch />
          <AnalyticsChatLauncher />
        </div>
        <DateRangePicker
          value={{ from: new Date(from), to: new Date(to) }}
          onApply={(range, interval) => {
            if (range.from && range.to) {
              // 1. Format the dates into stable strings outside the transition
              const formattedFrom = format(range.from, "yyyy-MM-dd");
              const formattedTo = format(range.to, "yyyy-MM-dd");

              // 2. Pass those ready-made strings into the transition
              startTransition(() => {
                dispatch(setDateRange({ 
                  from: formattedFrom, 
                  to: formattedTo, 
                  interval 
                }));
              });
            }
          }}
          timezone={timezone}
        />
        
      {isPending && (
        <p className="text-xs text-muted-foreground">Updating dashboard…</p>
      )}

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
        data={analytics.timeseries.data?.data ?? []}
        isLoading={analytics.timeseries.isLoading}
        isError={analytics.timeseries.isError}
        error={analytics.timeseries.error}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ExitPageCard
          data={analytics.exitPages.data?.data ?? []}
          isLoading={analytics.exitPages.isLoading}
          isError={analytics.exitPages.isError}
          error={analytics.exitPages.error}
        />
        {analytics.dimensions.map((dimension) => {
          const result = analytics.dimensionMap[dimension];
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

      <PageFlowCard
        data={analytics.pageFlow.data}
        availablePages={analytics.flowPages}
        selectedPage={analytics.activeFlowPage}
        onPageChange={analytics.setSelectedFlowPage}
        isPagesLoading={analytics.pagesAreLoading}
        isPagesError={analytics.isPagesError}
        pagesError={analytics.pagesError}
        isLoading={analytics.pageFlow.isLoading}
        isError={analytics.pageFlow.isError}
        error={analytics.pageFlow.error}
      />

          {activeDrilldown && !activeDrilldown.liveMode && <DimensionDrilldownPopup />}
    </div>
  );
}