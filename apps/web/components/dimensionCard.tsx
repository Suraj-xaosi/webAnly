/*"use client"
import { useDimension } from "@/hooks/useDimension";
import { ChartBarMixed } from "@workspace/ui/components/main/ChartBarMixed";



export type Dimension = "page" | "browser" | "device" | "country" | "os" | "referrer";

export interface DimensionParams {
  domainId:  string;
  from:      string;       // "YYYY-MM-DD"
  to:        string;       // "YYYY-MM-DD"
  dimension: Dimension;
  limit?:    number;       // default 100, max 500
}



export function DimensionCard({ domainId, from, to, dimension, limit }: DimensionParams) {
  const { data, isLoading, isError, error } = useDimension({ domainId, from, to, dimension, limit });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }
  const dataKey = "visitors";



  return (
    <div>
      <h2>Dimension Data</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <ChartBarMixed data={data?.data || []} dataKey={dataKey} />
    </div>
  );
}
*/
//web/components/dimensionCard.tsx
"use client"
import { ChartBarMixed } from "@workspace/ui/components/main/ChartBarMixed";
import type { Dimension, DimensionPoint, ApiError } from "@/hooks/useDimension";

export interface DimensionCardProps {
  data: DimensionPoint[];          // ✅ matches ChartBarMixed exactly
  isLoading: boolean;
  isError: boolean;
  error?: ApiError | null;         // ✅ use ApiError, not Error
  dimension: Dimension;
  isLive?: boolean;                // ✅ Optional live indicator
}

export function DimensionCard({ data, isLoading, isError, error, dimension }: DimensionCardProps) {
  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <div>
      <div className="flex items-center gap-2">
        <h2>{dimension} Data</h2>
        
      </div>
      <ChartBarMixed data={data} dataKey="visitors" />
    </div>
  );
}