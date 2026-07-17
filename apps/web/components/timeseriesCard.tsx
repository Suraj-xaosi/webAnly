//web/components/timeseriesCard.tsx
"use client"
import { AreaChartGradient } from "@workspace/ui/components/main/areaChartGradient";
import type { TimeseriesPoint, ApiError } from "@/hooks/useTimeseries";

interface TimeseriesCardProps {
  data: TimeseriesPoint[];
  isLoading: boolean;
  isError: boolean;
  error?: ApiError | null;
  isLive?: boolean;         // ✅ Optional live indicator
}

export function TimeseriesCard({ data, isLoading, isError, error }: TimeseriesCardProps) {
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <div>
      <AreaChartGradient data={data} />
    </div>
  );
}