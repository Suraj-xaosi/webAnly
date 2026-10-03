"use client"

import { AnalyticsChatLauncher } from "@/components/ai/analyticsChatLauncher"
import { format } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectFrom, selectTo, selectInterval, setDateRange,selectTimezone } from "@/store/slices/dashboardSlice";
import { TimeseriesCard } from "@/components/dashCards/timeseriesCard";
import { DimensionCard } from "@/components/dashCards/dimensionCard";
import { DateRangePicker } from "@workspace/ui/components/main/dateRangePicker";
import DomainSwitch from "@/components/picker/domainSwitch";
import { ExitPageCard } from "@/components/dashCards/exitPageCard";
import TimezonePicker from "@/components/picker/timezonePicker";
import { DimensionTimeseriesPanel } from "@/components/dashCards/dimensionTimeseriesPanel";
import { selectDimensionTimeseriesSelection } from "@/store/slices/dimensionTimeseriesSlice";
import { PageFlowCard } from "@/components/dashCards/pageFlowCard";
import { useDashboardAnalytics } from "@/hooks/analytics/useDashboardAnalytics";
import { useDomainSelection } from "@/hooks/domainCrud/useDomainSelection";
import { useTransition } from "react";
import Link from "next/link";
import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const [isPending, startTransition] = useTransition();
  const dimensionTimeseriesSelection = useAppSelector(selectDimensionTimeseriesSelection);
  const {
    activeDomainId: domainId,
    data: domains,
    isLoading: areDomainsLoading,
    isError: domainsFailed,
    error: domainsError,
    refetch: refetchDomains,
  } = useDomainSelection();
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
    allPageMap,
    isAllPageMap,
    pagesAreLoading,
    pagesError,
    isPagesError,
    setSelectedFlowPage,
  } = useDashboardAnalytics({ domainId, from, to, interval, timezone });
  const selectedPageMetrics = dimensionMap.page.data?.data.find(
    (entry) => entry.name === activeFlowPage
  );

  return (
    <div className="grid min-w-0 gap-6">
      {areDomainsLoading ? (
        <div
          className="grid min-w-0 gap-6"
          role="status"
          aria-busy="true"
          aria-label="Loading dashboard"
        >
          <span className="sr-only">Loading your domains and dashboard</span>
          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-10 w-44" />
            <Skeleton className="size-9 rounded-lg" />
            <div className="ml-auto flex flex-wrap gap-2">
              <Skeleton className="h-9 w-56 max-w-full" />
              <Skeleton className="h-9 w-52 max-w-full" />
            </div>
          </div>
          <div className="grid gap-4 rounded-xl border bg-card p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="aspect-video w-full" />
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
            {Array.from({ length: 8 }, (_, item) => (
              <div key={item} className="grid gap-4 rounded-xl border bg-card p-5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="aspect-video w-full" />
              </div>
            ))}
          </div>
          <div className="grid gap-4 rounded-xl border bg-card p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-[360px] w-full" />
          </div>
        </div>
      ) : domainsFailed && !domains ? (
        <div
          className="grid justify-items-start gap-3 rounded-xl border border-destructive/40 bg-card p-6"
          role="alert"
        >
          <p className="font-medium">Your domains couldn’t be loaded.</p>
          <p className="text-sm text-muted-foreground">
            {domainsError?.message ?? "Please check your connection and try again."}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetchDomains()}>
            Try again
          </Button>
        </div>
      ) : !domains?.length ? (
        <div className="grid justify-items-start gap-3 rounded-xl border border-dashed bg-card p-6">
          <p className="font-medium">Add a domain to get started.</p>
          <p className="text-sm text-muted-foreground">
            Your analytics dashboard will appear here once you add a website.
          </p>
          <Button asChild size="sm">
            <Link href="/domain#add">Add domain</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <DomainSwitch />
              <AnalyticsChatLauncher />
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <DateRangePicker
                value={{ from: new Date(from), to: new Date(to) }}
                onApply={(range, interval) => {
                  if (range.from && range.to) {
                    const formattedFrom = format(range.from, "yyyy-MM-dd");
                    const formattedTo = format(range.to, "yyyy-MM-dd");

                    startTransition(() => {
                      dispatch(setDateRange({
                        from: formattedFrom,
                        to: formattedTo,
                        interval,
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
          </div>

          <TimeseriesCard
            data={timeseries.data?.data ?? []}
            isLoading={timeseries.isLoading}
            isError={timeseries.isError}
            error={timeseries.error}
            onRetry={timeseries.refetch}
          />

          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-2">
            <ExitPageCard
              data={exitPages.data?.data ?? []}
              isLoading={exitPages.isLoading}
              isError={exitPages.isError}
              error={exitPages.error}
              onRetry={exitPages.refetch}
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
                  onRetry={result.refetch}
                />
              );
            })}
          </div>

          <PageFlowCard
            data={pageFlow.data}
            selectedPageMetrics={selectedPageMetrics}
            allPageMapData={allPageMap.data}
            allPageMapLoading={allPageMap.isLoading}
            allPageMapError={allPageMap.error}
            onRetryAllPageMap={allPageMap.refetch}
            isAllPageMap={isAllPageMap}
            availablePages={flowPages}
            selectedPage={activeFlowPage}
            onPageChange={setSelectedFlowPage}
            isPagesLoading={pagesAreLoading}
            isPagesError={isPagesError}
            pagesError={pagesError}
            onRetryPages={dimensionMap.page.refetch}
            isLoading={pageFlow.isLoading}
            isError={pageFlow.isError}
            error={pageFlow.error}
            onRetryFlow={pageFlow.refetch}
          />

          {dimensionTimeseriesSelection?.mode === "historical" && (
            <DimensionTimeseriesPanel />
          )}
        </>
      )}
    </div>
  );
}