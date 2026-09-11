
"use client"
import { memo, useState } from "react";
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
import type { Dimension, DimensionPoint, ApiError } from "@/hooks/analytics/useDimension";
import { Badge } from "@workspace/ui/components/badge";
import { useAppDispatch } from "@/store/hooks";
import { openDrilldown } from "@/store/slices/drilldownSlice";

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

export const DimensionCard = memo(function DimensionCard({ data, isLoading, isError, error, dimension, isLive }: DimensionCardProps) {
  const dispatch = useAppDispatch();
  const [selectedMetric, setSelectedMetric] = useState<DataKey>("visitors");

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error?.message}</div>;

  return (
    <Card className="relative">
      <CardHeader className="flex items-center justify-between gap-2">
        <CardTitle className="capitalize">{dimension}</CardTitle>
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
      {isLive &&
        (
              <Badge
                variant="secondary"
                className="absolute right-4 top-4 z-10 gap-1.5 animate-pulse"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </Badge>
        )
      }

      <ChartBarMixed
        data={data}
        dataKey={selectedMetric}
        onSelectItem={(name) => dispatch(openDrilldown({ dimension, value: name, liveMode: Boolean(isLive) }))}
      />

    </Card>
  );
});