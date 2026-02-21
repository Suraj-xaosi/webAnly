"use client";

import { useState } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart";
import { useAppSelector } from "../../../../store/hooks";
import ChartCard from "../../../appComponents/cards/chartcard";

export default function DevicesChart() {
  const [selectedMetric, setSelectedMetric] = useState<
    "views" | "visitors" | "avgTimeSpent"
  >("views");

  const dChartdata = useAppSelector((state) => state.breakdown.data.device);

  if (!dChartdata || dChartdata.length === 0) {
    return (
      <ChartCard
        chartName="Visits per Device"
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

  // Extract categories and values
  const categories = dChartdata.map((d) => d.name);
  const values = dChartdata.map((d) => getValue(d));

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
    grid: {
      left: "3%",
      right: "3%",
      bottom: "3%",
      top: "20%",
      containLabel: true,
    },
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
      chartName="Visits per Device"
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
