
"use client"
import { useState } from "react";
import { ChartBarExit, type ExitDataKey, type ExitPagePoint } from "@workspace/ui/components/main/chartBarExit";
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
import type { ApiError } from "@/hooks/analytics/useExitPages";
import { AnalyticsCardState } from "./analyticsCardState";

export interface ExitPageCardProps {
  data: ExitPagePoint[];
  isLoading: boolean;
  isError: boolean;
  error?: ApiError | null;
  onRetry?: () => void;
}

const METRIC_OPTIONS: { value: ExitDataKey; label: string }[] = [
  { value: "exits", label: "Exits" },
  { value: "exitRate", label: "Exit Rate (%)" },
];

export function ExitPageCard({ data, isLoading, isError, error, onRetry }: ExitPageCardProps) {
  const [selectedMetric, setSelectedMetric] = useState<ExitDataKey>("exits");

  if (isLoading || (isError && data.length === 0)) {
    return <AnalyticsCardState isLoading={isLoading} isError={isError} error={error} onRetry={onRetry} />;
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-2">
        <CardTitle>Exit Pages</CardTitle>
        <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as ExitDataKey)}>
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
      {isError && (
        <div className="px-6 pb-3">
          <AnalyticsCardState isLoading={false} isError error={error} hasData onRetry={onRetry} />
        </div>
      )}
      <ChartBarExit data={data} dataKey={selectedMetric} />
    </Card>
  );
}