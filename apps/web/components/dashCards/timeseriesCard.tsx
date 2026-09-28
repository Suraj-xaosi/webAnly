"use client"
import { AreaChartGradient } from "@workspace/ui/components/main/areaChartGradient";
import type { TimeseriesPoint, ApiError } from "@/hooks/analytics/useTimeseries";
import { Badge } from "@workspace/ui/components/badge";
import { AnalyticsCardState } from "./analyticsCardState";

interface TimeseriesCardProps {
  data: TimeseriesPoint[];
  isLoading: boolean;
  isError: boolean;
  error?: ApiError | null;
  isLive?: boolean;
  onRetry?: () => void;
}

export function TimeseriesCard({ data, isLoading, isError, error, isLive, onRetry }: TimeseriesCardProps) {
  if (isLoading || (isError && data.length === 0)) {
    return <AnalyticsCardState isLoading={isLoading} isError={isError} error={error} onRetry={onRetry} />;
  }

  return (
    <div className="relative">
      {isError && (
        <AnalyticsCardState isLoading={false} isError error={error} hasData onRetry={onRetry} />
      )}
      {isLive && (
        <Badge
          variant="secondary"
          className="absolute right-4 top-4 z-10 gap-1.5 animate-pulse"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Live
        </Badge>
      )}
      <AreaChartGradient data={data} />
    </div>
  );
}