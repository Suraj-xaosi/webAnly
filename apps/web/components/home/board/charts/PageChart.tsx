"use client";

import { useState } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart";
import { useAppSelector } from "../../../../store/hooks";
import ChartCard from "../../../appComponents/cards/chartcard";

export default function PagesChart() {
  const [selectedMetric, setSelectedMetric] = useState<
    "views" | "visitors" | "avgTimeSpent"
  >("views");

  const pageChartdata = useAppSelector((state) => state.breakdown.data.page);

  if (!pageChartdata || pageChartdata.length === 0) {
    return (
      <ChartCard
        chartName="Visits per Page"
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
    series: [
      {
        name: getMetricLabel(),
        type: "pie",
        radius: "60%",
        center: ["50%", "55%"],
        roseType: "radius",
        data: pageChartdata.map((d) => ({
          name: d.name,
          value:
            selectedMetric === "views"
              ? d.views
              : selectedMetric === "visitors"
              ? d.visitors
              : d.avgTimeSpent || 0,
        })),
        label: {
          color: "#fff",
          fontSize: 12,
          formatter: (params: any) => {
            const formattedValue = formatValue(params.value);
            return `${params.name}: ${formattedValue}`;
          },
        },
        labelLine: {
          smooth: 0.2,
          length: 10,
          length2: 20,
          lineStyle: {
            color: "rgba(255, 255, 255, 0.4)",
          },
        },
        itemStyle: {
          shadowBlur: 100,
          shadowColor: "rgba(0, 0, 0, 0.5)",
          color: new echarts.graphic.LinearGradient(0, 0, 1, 1, [
            { offset: 0, color: "#73a5ff" },
            { offset: 1, color: "#5470c6" },
          ]),
        },
        animationType: "scale",
        animationEasing: "elasticOut",
        animationDelay: (idx: number) => Math.random() * 200,
      },
    ],
  };

  return (
    <ChartCard
      chartName="Visits per Page"
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
