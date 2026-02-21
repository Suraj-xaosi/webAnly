"use client";

import { useState } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart";
import { useAppSelector } from "../../../../store/hooks";
import ChartCard from "../../../appComponents/cards/chartcard";

export default function BrowsersChart() {
  const [selectedMetric, setSelectedMetric] = useState<
    "views" | "visitors" | "avgTimeSpent"
  >("views");

  const bChartdata = useAppSelector((s) => s.breakdown.data.browser);
  const loading = useAppSelector((s) => s.breakdown.loading);
  const error = useAppSelector((s) => s.breakdown.error);

  if (loading) {
    return (
      <ChartCard
        chartName="Visits per Browser"
        onMetricChange={setSelectedMetric}
        selectedMetric={selectedMetric}
      >
        <div className="text-gray-400">Loading...</div>
      </ChartCard>
    );
  }

  if (error) {
    return (
      <ChartCard
        chartName="Visits per Browser"
        onMetricChange={setSelectedMetric}
        selectedMetric={selectedMetric}
      >
        <div className="text-red-400">Error: {error}</div>
      </ChartCard>
    );
  }

  if (!bChartdata || bChartdata.length === 0) {
    return (
      <ChartCard
        chartName="Visits per Browser"
        onMetricChange={setSelectedMetric}
        selectedMetric={selectedMetric}
      >
        <div className="flex items-center justify-center h-full bg-white/10 rounded-xl shadow-inner text-gray-300 text-lg font-medium">
          No data available
        </div>
      </ChartCard>
    );
  }

  // Helper function to get value based on selected metric
  const getValue = (item: { views: number; visitors: number; avgTimeSpent: number | null }) => {
    switch (selectedMetric) {
      case "views":
        return item.views;
      case "visitors":
        return item.visitors;
      case "avgTimeSpent":
        return item.avgTimeSpent || 0;
      default:
        return item.views;
    }
  };

  // Helper function to format value for display
  const formatValue = (value: number) => {
    if (selectedMetric === "avgTimeSpent") {
      const minutes = Math.floor(value / 60);
      const seconds = Math.floor(value % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
    return value.toString();
  };

  const categories = bChartdata.map((b: { name: string }) => b.name);
  const values = bChartdata.map((b) => getValue(b));

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any) => {
        const value = params[0].value;
        const formattedValue = formatValue(value);
        return `${params[0].name}: ${formattedValue}`;
      },
    },
    xAxis: {
      type: "category",
      data: categories,
      axisLine: { lineStyle: { color: "#888" } },
      axisLabel: { color: "#fff" },
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#888" } },
      splitLine: { lineStyle: { color: "#333" } },
      axisLabel: {
        color: "#fff",
        formatter: (value: number) => {
          if (selectedMetric === "avgTimeSpent") {
            const minutes = Math.floor(value / 60);
            return `${minutes}m`;
          }
          return value.toString();
        },
      },
    },
    series: [
      {
        type: "bar",
        data: values,
        itemStyle: {
          color: "#4fa3ff",
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: "40%",
        label: {
          show: true,
          position: "top",
          valueAnimation: true,
          formatter: (params: any) => formatValue(params.value),
        },
      },
    ],
    legend: {
      show: true,
    },
    animationDuration: 0,
    animationDurationUpdate: 3000,
    animationEasing: "linear",
    animationEasingUpdate: "linear",
  };

  return (
    <ChartCard
      chartName="Visits per Browser"
      onMetricChange={setSelectedMetric}
      selectedMetric={selectedMetric}
    >
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: "100%", width: "100%" }}
        notMerge={true}
        lazyUpdate={true}
      />
    </ChartCard>
  );
}
