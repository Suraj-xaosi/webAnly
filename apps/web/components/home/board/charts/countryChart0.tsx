"use client";

import React, { useEffect } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import echarts from "./echart";
import { useAppSelector } from "../../../../store/hooks";

export default function countryChart0() {
  const countryChartdata = useAppSelector(
    (state) => state.breakdown.data.country
  );

  // Load world map once
  useEffect(() => {
    if (echarts.getMap("world")) return;

    fetch("https://echarts.apache.org/examples/data/asset/geo/world.json")
      .then((res) => res.json())
      .then((geoJson) => {
        echarts.registerMap("world", geoJson);
      });
  }, []);

  if (!countryChartdata || countryChartdata.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-white/10 rounded-xl shadow-inner text-gray-300 text-lg font-medium">
        No data available
      </div>
    );
  }

  const option: echarts.EChartsCoreOption = {
    backgroundColor: "transparent",

    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        if (params.value == null) return `${params.name}: No data`;
        return `${params.name}<br/>Visits: ${params.value}`;
      },
    },

    series: [
      {
        name: "Visits",
        type: "map",
        map: "world",
        roam: true,
        zoom: 1.1,

        itemStyle: {
          areaColor: "#a78bfa",
          borderColor: "#1f2937",
          borderWidth: 0.6,
        },

        emphasis: {
          label: { show: false },
          itemStyle: {
            areaColor: "#7c3aed",
          },
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
      <h2 className="text-sm sm:text-base text-white font-semibold mb-2 tracking-wide drop-shadow">
        Visits per Country
      </h2>

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
