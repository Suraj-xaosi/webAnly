"use client"
import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart";
import { useAppSelector } from "../../../../store/hooks";

type PageData = {
  name: string;
  views: number;
};

export default function PagesChart() {

  const pageChartdata = useAppSelector((state) => state.analytics.pages);
  if (pageChartdata.length === 0) {
    return <div className="text-gray-400">No data available</div>;
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
    <div className="bg-[#181c23] text-white p-8">
      <div className="w-full  h-80 p-4 bg-[#232733] rounded-2xl shadow">
        <h2 className="text-xs text-blue-400 font-semibold mb-1">
          Visits per Page
        </h2>
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ height: "16rem", width: "100%" }}
        />
      </div>
    </div>
  );
}
