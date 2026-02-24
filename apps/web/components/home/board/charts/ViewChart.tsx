"use client";

import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart"; 
import { useAppSelector } from "../../../../store/hooks";


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
  color: ['#80FFA5', '#00DDFF', '#37A2FF', '#FF0087', '#FFBF00'],
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
    data: ['views', 'visitors']
  },
  toolbox: {
    feature: {
      saveAsImage: {}
    }
  },
  xAxis: [
    {
      type: 'category',
      boundaryGap: false,
      data: chartdata.map((d) => d.date)
    }
  ],
  yAxis: [
    {
      type: 'value'
    }
  ],
  series: [
    {
      name: 'views',
      type: 'line',
      stack: 'Total',
      smooth: true,
      lineStyle: {
        width: 0
      },
      showSymbol: false,
      areaStyle: {
        opacity: 0.8,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: 'rgb(128, 255, 165)'
          },
          {
            offset: 1,
            color: 'rgb(1, 191, 236)'
          }
        ])
      },
      emphasis: {
        focus: 'series'
      },
      data: chartdata.map((d) => d.views)
    },
    {
      name: 'visitors',
      type: 'line',
      stack: 'Total',
      smooth: true,
      lineStyle: {
        width: 0
      },
      showSymbol: false,
      areaStyle: {
        opacity: 0.8,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: 'rgb(0, 221, 255)'
          },
          {
            offset: 1,
            color: 'rgb(77, 119, 255)'
          }
        ])
      },
      emphasis: {
        focus: 'series'
      },
      data: chartdata.map((d) => d.visitors)
    },
    
    ]
  };


  return (
    <div className="w-full h-80 sm:h-96 md:h-[35rem] p-4 sm:p-6 bg-gradient-to-br from-[#8B5CF6] to-[#6F42C1] rounded-2xl shadow-xl shadow-purple-800/40 flex flex-col mb-4">
      <h2 className="text-lg  text-white font-semibold">visits</h2>
     
        <ReactEChartsCore
          echarts={echarts}
          option={option}
          style={{ height: "100%", width: "100%" }}
        />
      
    </div>
  );
}

