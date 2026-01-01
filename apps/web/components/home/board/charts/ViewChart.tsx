"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart"; //
import { useAppSelector } from "../../../../store/hooks";

type chd = {
  interval: string;
  views: number;
};

export default function ViewsChart() {
  const chartdata = useAppSelector((state) => state.timeseries.data);
  
  if (!chartdata || chartdata.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/10 rounded-xl shadow-inner text-gray-300 text-lg font-medium">
        No data available
      </div>
    );
  }

  const option = {
    backgroundColor: "#232733",
    tooltip: { trigger: "axis" },
    legend: {    
      data: ["Total Views", "Unique Visitors"],
      textStyle: { color: "#a1a1a1" },
    },
    grid: { left: "3%", right: "3%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: chartdata.map((d) => d.date),
      axisLine: { lineStyle: { color: "#555" } },
      axisLabel: { color: "#aaa" },
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#555" } },
      splitLine: { lineStyle: { color: "#333" } },
      axisLabel: { color: "#aaa" },
    },
    series: [
      {
        name: "Total Views",
        type: "line",
        smooth: true,
        showSymbol: false,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(0, 136, 212, 0.8)" },
            { offset: 1, color: "rgba(0, 136, 212, 0.1)" },
          ]),
        },
        lineStyle: { color: "#0088d4" },
        data: chartdata.map((d) => d.views),
      }
      /*{
        name: "Unique Visitors",
        type: "line",
        smooth: true,
        showSymbol: false,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(0, 255, 136, 0.8)" },
            { offset: 1, color: "rgba(0, 255, 136, 0.1)" },
          ]),
        },
        lineStyle: { color: "#00ff88" },
        data: uniquevisitorsdata.map((d) => d.views),
      },*/
    ],
  };

  return (
    <div className="w-full h-80 sm:h-96 md:h-[28rem] p-4 sm:p-6 bg-gradient-to-br from-[#8B5CF6] to-[#6F42C1] rounded-2xl shadow-xl shadow-purple-800/40 flex flex-col mb-4">
      <h2 className="text-lg sm:text-xl text-white font-semibold mb-2 tracking-wide drop-shadow">Total Landings</h2>
      <div className="flex-1 min-h-0">
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}

