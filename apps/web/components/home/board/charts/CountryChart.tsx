"use client";
import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart";  
import { useAppSelector } from "../../../../store/hooks";
type cc= {
  name: string;
  views: number;
};
export default function CountryChart() {

  const countryChartdata = useAppSelector((state) => state.analytics.countries);
  if(countryChartdata.length===0  ){
    return <div className="text-gray-400">No data available</div>;
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
    <div className="bg-[#181c23]  text-white p-8">
      <div className="w-full h-80 p-4 bg-[#232733] rounded-2xl shadow">
        <h2 className="text-xs text-blue-400 font-semibold mb-1">visits per country </h2>
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ height: "16rem", width: "100%" }}
        />
    </div>
  </div>
  );
}