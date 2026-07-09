/*"use client"
import { useTimeseries, type TimeseriesPoint, type Interval } from "@/hooks/useTimeseries";
import { AreaChartGradient } from "@workspace/ui/components/main/areaChartGradient";

interface TimeseriesProps {
  domainId: string;
  from: string;
  to: string;
  interval?: Interval;
}



export function TimeseriesCard({ domainId, from, to, interval }: TimeseriesProps) {
  const res = useTimeseries({ domainId, from, to, interval });
  const data:TimeseriesPoint[] = res.data?.data || [];
  
  if (res.isLoading) {
    return <div>Loading...</div>;
  }

  if (res.isError) {
    return <div>Error: {res.error?.message}</div>;
  }

  return (
    <div>
      <h2>Timeseries Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <AreaChartGradient data={data} />
    </div>
  );
}
*/

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
      <div className="flex items-center gap-2">
        <h2>Timeseries Data</h2>
      </div>
      <AreaChartGradient data={data} />
    </div>
  );
}