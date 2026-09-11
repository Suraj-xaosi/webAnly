"use client";

import { X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { AreaChartGradient } from "@workspace/ui/components/main/areaChartGradient";
import { useDimensionTimeseries } from "@/hooks/analytics/useDimTimeseries";
import { useRealtimeDimensionTimeseries } from "@/hooks/realtime/useRealtimeDimensionTimeseries";
import { useAppDispatch } from "@/store/hooks";
import { closeDrilldown } from "@/store/slices/drilldownSlice";
import { useDrilldownContext } from "@/hooks/analytics/useDrilldownContext";

export function DimensionDrilldownPopup() {
  const dispatch = useAppDispatch();
  const { drilldown } = useDrilldownContext();
  if (!drilldown) return null;

  const { dimension, value } = drilldown;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] max-w-[90vw]">
      <Card className="shadow-2xl ring-2 ring-foreground/10">
        <CardHeader className="flex-row items-center justify-between gap-2">
          <CardTitle className="capitalize truncate">
            {dimension}: {value}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(closeDrilldown())}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {drilldown.liveMode ? <RealtimeDrilldownChart /> : <HistoricalDrilldownChart />}
        </CardContent>
      </Card>
    </div>
  );
}

function HistoricalDrilldownChart() {
  const { drilldown, domainId, from, to, timezone } = useDrilldownContext();

  const historical = useDimensionTimeseries({
    domainId,
    from,
    to,
    dimension: drilldown?.dimension ?? "page",
    value: drilldown?.value ?? "",
    timezone,
  });

  if (!drilldown) return null;

  if (historical.isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (historical.isError) {
    return <div className="py-8 text-center text-sm text-destructive">Failed to load data</div>;
  }

  return <AreaChartGradient data={historical.data?.data ?? []} />;
}

function RealtimeDrilldownChart() {
  const { drilldown, domainId, from, to, timezone } = useDrilldownContext();

  const realtime = useRealtimeDimensionTimeseries(
    drilldown?.dimension ?? "page",
    drilldown?.value ?? "",
    domainId,
    from,
    to,
    true,
    timezone
  );

  if (!drilldown) return null;

  if (realtime.isLoading) {
    return <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>;
  }

  if (realtime.isError) {
    return <div className="py-8 text-center text-sm text-destructive">Failed to load data</div>;
  }

  return <AreaChartGradient data={realtime.data} />;
}