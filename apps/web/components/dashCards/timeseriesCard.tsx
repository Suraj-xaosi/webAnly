"use client"
import { AreaChartGradient } from "@workspace/ui/components/main/areaChartGradient";
import type { TimeseriesPoint, ApiError } from "@/hooks/analytics/useTimeseries";
import { Badge } from "@workspace/ui/components/badge";

interface TimeseriesCardProps {
  data: TimeseriesPoint[];
  isLoading: boolean;
  isError: boolean;
  error?: ApiError | null;
  isLive?: boolean;
}

export function TimeseriesCard({ data, isLoading, isError, error, isLive }: TimeseriesCardProps) {
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <div className="relative">
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