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
import { selectActiveDrilldown } from "@/store/slices/drilldownSlice";
import { PageFlowCard } from "@/components/dashCards/pageFlowCard";
import { useDashboardAnalytics } from "@/hooks/analytics/useDashboardAnalytics";
import { useTransition } from "react";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const [isPending, startTransition] = useTransition();
  const activeDrilldown = useAppSelector(selectActiveDrilldown);
  const domainId = useAppSelector(selectDomainId);
  const from = useAppSelector(selectFrom);
  const to = useAppSelector(selectTo);
  const interval = useAppSelector(selectInterval);
  const timezone = useAppSelector(selectTimezone);

  const {
    timeseries,
    exitPages,
    dimensionMap,
    dimensions,
    flowPages,
    activeFlowPage,
    pageFlow,
    pagesAreLoading,
    pagesError,
    isPagesError,
    dataError,
    setSelectedFlowPage,
  } = useDashboardAnalytics({ domainId, from, to, interval, timezone });
  const selectedPageMetrics = dimensionMap.page.data?.data.find(
    (entry) => entry.name === activeFlowPage
  );

  const errorMessage = dataError
    ? typeof dataError === "string"
      ? dataError
      : dataError.message ?? "Unable to load analytics data. Please try again."
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
        {dimensions.map((dimension) => {
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

      <PageFlowCard
        data={pageFlow.data}
        selectedPageMetrics={selectedPageMetrics}
        availablePages={flowPages}
        selectedPage={activeFlowPage}
        onPageChange={setSelectedFlowPage}
        isPagesLoading={pagesAreLoading}
        isPagesError={isPagesError}
        pagesError={pagesError}
        isLoading={pageFlow.isLoading}
        isError={pageFlow.isError}
        error={pageFlow.error}
      />

          {activeDrilldown && !activeDrilldown.liveMode && <DimensionDrilldownPopup />}
    </div>
  );
}