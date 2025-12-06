"use client"
import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart"; 
import { useAppSelector } from "../../../../store/hooks";


export default function BrowsersChart() {

  const bChartdata = useAppSelector((state) => state.analytics.browsers);
  const loading = useAppSelector((state) => state.analytics.loading);
  const error = useAppSelector((state) => state.analytics.error);
  // Loading state first
  if (loading) {
    return <div className="text-gray-400">Loading...</div>;
  }

  // Error state
  if (error) {
    return <div className="text-red-400">Error: {error}</div>;
  }

  // Empty or missing data
  if (!bChartdata || bChartdata.length === 0) {
    return <div className="text-gray-400">No data available</div>;
  }
  const categories = bChartdata.map((b:{name:string,views:number}) => b.name);
  const values = bChartdata.map((b:{name:string,views:number}) => b.views);

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
    legend: {
    show: true
  },
  animationDuration: 0,
  animationDurationUpdate: 3000,
  animationEasing: 'linear',
  animationEasingUpdate: 'linear'
  };
   



  return (
    <div className="bg-[#181c23]  text-white p-8">
      <div className="w-full h-80 p-4 bg-[#232733] rounded-2xl shadow">
        <h2 className="text-xs text-blue-400 font-semibold mb-1">visits per browser </h2>
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
