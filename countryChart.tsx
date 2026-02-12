"use client";

import { useState } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart";
import { useAppSelector } from "../../../../store/hooks";
import ChartCard from "./chartcard";

export default function CountryChart() {
  const [selectedMetric, setSelectedMetric] = useState<
    "views" | "visitors" | "avgTimeSpent"
  >("views");

  const countryChartdata = useAppSelector(
    (state) => state.breakdown.data.country
  );

  if (!countryChartdata || countryChartdata.length === 0) {
    return (
      <ChartCard
        chartName="Visits per Country"
        onMetricChange={setSelectedMetric}
        selectedMetric={selectedMetric}
      >
        <div className="flex items-center justify-center h-full bg-white/10 rounded-xl shadow-inner text-gray-300 text-lg font-medium">
          No data available
        </div>
      </ChartCard>
    );
  }

  // Helper function to get the label based on selected metric
  const getMetricLabel = () => {
    switch (selectedMetric) {
      case "views":
        return "Views";
      case "visitors":
        return "Visitors";
      case "avgTimeSpent":
        return "Avg Time Spent";
      default:
        return "Views";
    }
  };

  // Helper function to format value for tooltip
  const formatValue = (value: number) => {
    if (selectedMetric === "avgTimeSpent") {
      // Convert seconds to minutes:seconds format
      const minutes = Math.floor(value / 60);
      const seconds = Math.floor(value % 60);
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
    return value.toString();
  };

  const option: echarts.EChartsCoreOption = {
    backgroundColor: "#232733",
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const formattedValue = formatValue(params.value);
        return `${params.name}: ${formattedValue} (${params.percent}%)`;
      },
    },
    legend: {
      top: "5%",
      left: "center",
      textStyle: { color: "#aaa" },
    },
    series: [
      {
        name: getMetricLabel(),
        type: "pie",
        radius: ["20%", "70%"],
        center: ["50%", "55%"],
        roseType: "radius", // 🌹 Nightingale (rose) style
        itemStyle: {
          borderRadius: 8,
        },
        label: {
          color: "#ddd",
          formatter: (params: any) => {
            const formattedValue = formatValue(params.value);
            return `${params.name}: ${formattedValue}`;
          },
        },
        labelLine: {
          lineStyle: { color: "#666" },
          smooth: 0.2,
          length: 10,
          length2: 20,
        },
        data: countryChartdata.map((c) => ({
          name: c.name,
          value:
            selectedMetric === "views"
              ? c.views
              : selectedMetric === "visitors"
              ? c.visitors
              : c.avgTimeSpent || 0,
        })),
      },
    ],
  };

  return (
    <ChartCard
      chartName="Visits per Country"
      onMetricChange={setSelectedMetric}
      selectedMetric={selectedMetric}
    >
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: "100%", width: "100%" }}
      />
    </ChartCard>
  );
}
