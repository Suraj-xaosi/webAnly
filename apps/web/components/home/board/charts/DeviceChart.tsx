"use client";
import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart"; 
import { useAppSelector } from "../../../../store/hooks";

type dcd = {
  name: string;
  views: number;
};

export default function DevicesChart() {
  const dChartdata = useAppSelector((state) => state.analytics.devices);
  if (dChartdata.length === 0) {
    return <div className="text-gray-400">No data available</div>;
  }

  // Extract categories and values
  const categories = dChartdata.map((d) => d.name);
  const values = dChartdata.map((d) => d.views);

  // ECharts option
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
    <div className="bg-[#181c23] text-white p-8">
      <div className="w-full h-80 p-4 bg-[#232733] rounded-2xl shadow">
        <h2 className="text-xs text-blue-400 font-semibold mb-1">
          Visits per Device
        </h2>
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ height: "16rem", width: "100%" }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
    </div>
  );
}
