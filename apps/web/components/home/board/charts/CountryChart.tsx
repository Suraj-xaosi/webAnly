"use client";
import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart";  
import { useAppSelector } from "../../../../store/hooks";
type cc= {
  name: string;
  views: number;
};
export default function CountryChart() {

  const countryChartdata = useAppSelector((state) => state.breakdown.data.country);
  if (!countryChartdata || countryChartdata.length === 0) {
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
    legend: {
      top: "5%",
      left: "center",
      textStyle: { color: "#aaa" },
    },
    series: [
      {
        name: "Devices",
        type: "pie",
        radius: ["20%", "70%"],
        center: ["50%", "55%"],
        roseType: "radius", // 🌹 Nightingale (rose) style
        itemStyle: {
          borderRadius: 8,
        },
        label: {
          color: "#ddd",
        },
        labelLine: {
          lineStyle: { color: "#666" },
          smooth: 0.2,
          length: 10,
          length2: 20,
        },
        data: countryChartdata.map((c) => ({
          name: c.name,
          value: c.views,
        })),
      },
    ],
  };


  return (
    <div className="w-full h-72 sm:h-80 md:h-96 p-4 sm:p-6 bg-gradient-to-br from-[#8B5CF6] to-[#6F42C1] rounded-2xl shadow-xl shadow-purple-800/40 flex flex-col">
      <h2 className="text-sm sm:text-base text-white font-semibold mb-2 tracking-wide drop-shadow">Visits per Country</h2>
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