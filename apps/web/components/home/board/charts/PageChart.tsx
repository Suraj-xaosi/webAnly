"use client"
import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart";
import { useAppSelector } from "../../../../store/hooks";

type PageData = {
  name: string;
  views: number;
};

export default function PagesChart() {

  const pageChartdata = useAppSelector((state) => state.breakdown.data.page);
  if (!pageChartdata || pageChartdata.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/10 rounded-xl shadow-inner text-gray-300 text-lg font-medium">
        No data available
      </div>
    );
  }

  const option: echarts.EChartsCoreOption = {
    backgroundColor: "#232733",
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    series: [
      {
        name: "Page Views",
        type: "pie",
        radius: "60%",
        center: ["50%", "55%"],
        roseType: "radius",
        data: pageChartdata.map((d) => ({
          name: d.name,
          value: d.views,
        })),
        label: {
          color: "#fff",
          fontSize: 12,
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
    <div className="w-full h-72 sm:h-80 md:h-96 p-4 sm:p-6 bg-gradient-to-br from-[#8B5CF6] to-[#6F42C1] rounded-2xl shadow-xl shadow-purple-800/40 flex flex-col">
      <h2 className="text-sm sm:text-base text-white font-semibold mb-2 tracking-wide drop-shadow">Visits per Page</h2>
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
