"use client";


import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart"; 
import { useAppSelector } from "../../../../store/hooks";


export default function DevicesChart() {
  const dChartdata = useAppSelector((state) => state.breakdown.data.device);
  if (!dChartdata || dChartdata.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/10 rounded-xl shadow-inner text-gray-300 text-lg font-medium">
        No data available
      </div>
    );
  }

  // Extract categories and values
  const categories = dChartdata.map((d) => d.name);
  const values = dChartdata.map((d) => d.views);

 
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#888' } },
      axisLabel: { color: '#fff' },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: '#888' } },
      splitLine: { lineStyle: { color: '#333' } },
      axisLabel: { color: '#fff' },
    },
    series: [
      {
        type: 'bar',
        data: values,
        itemStyle: {
          color: '#4fa3ff',
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: '40%',
         label: {
          show: true,
          position: 'top',
          valueAnimation: true
        }
      },
    ],
    grid: { left: '3%', right: '3%', bottom: '3%', top: '20%', containLabel: true },
    legend: {
    show: true
  },
  animationDuration: 0,
  animationDurationUpdate: 3000,
  animationEasing: 'linear',
  animationEasingUpdate: 'linear'
  };

  return (
    <div className="w-full h-72 sm:h-80 md:h-96 p-4 sm:p-6 bg-gradient-to-br from-[#8B5CF6] to-[#6F42C1] rounded-2xl shadow-xl shadow-purple-800/40 flex flex-col">
      <h2 className="text-sm sm:text-base text-white font-semibold mb-2 tracking-wide drop-shadow">Visits per Device</h2>
      <div className="flex-1 min-h-0">
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ height: "100%", width: "100%" }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </div>
  );
}
