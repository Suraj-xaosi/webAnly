//web/components/dimensionCard.tsx
"use client"
import { useState } from "react";
import { ChartBarMixed, type DataKey } from "@workspace/ui/components/main/ChartBarMixed";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { Dimension, DimensionPoint, ApiError } from "@/hooks/useDimension";

export interface DimensionCardProps {
  data: DimensionPoint[];
  isLoading: boolean;
  isError: boolean;
  error?: ApiError | null;
  dimension: Dimension;
  isLive?: boolean;
}

const METRIC_OPTIONS: { value: DataKey; label: string }[] = [
  { value: "visitors", label: "Visitors" },
  { value: "views", label: "Views" },
  { value: "avgDwell", label: "Avg Dwell Time" },
  { value: "viewsPerVisitor", label: "Views per Visitor" },
];

export function DimensionCard({ data, isLoading, isError, error, dimension }: DimensionCardProps) {
  const [selectedMetric, setSelectedMetric] = useState<DataKey>("visitors");

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2">
        <CardTitle className="capitalize">{dimension} Data</CardTitle>
        <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as DataKey)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METRIC_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <ChartBarMixed data={data} dataKey={selectedMetric} />
    </Card>
  );
}