"use client";

import { ReactNode } from "react";

interface ChartProps {
  chartName?: string;
  onMetricChange: (metric: "views" | "visitors" | "avgTimeSpent") => void;
  selectedMetric: "views" | "visitors" | "avgTimeSpent";
  children: ReactNode;
}

export default function ChartCard({
  chartName,
  onMetricChange,
  selectedMetric,
  children,
}: ChartProps) {
  return (
    <div className="w-full h-72 sm:h-80 md:h-96 p-4 sm:p-6 bg-gradient-to-br from-[#8B5CF6] to-[#6F42C1] rounded-2xl shadow-xl shadow-purple-800/40 flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm sm:text-base text-white font-semibold tracking-wide drop-shadow">
          {chartName}
        </h2>
        <select
          value={selectedMetric}
          onChange={(e) =>
            onMetricChange(e.target.value as "views" | "visitors" | "avgTimeSpent")
          }
          className="px-3 py-1 text-xs sm:text-sm bg-white/20 text-white border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer backdrop-blur-sm hover:bg-white/30 transition-colors"
        >
          <option value="views" className="bg-[#6F42C1] text-white">
            Views
          </option>
          <option value="visitors" className="bg-[#6F42C1] text-white">
            Visitors
          </option>
          <option value="avgTimeSpent" className="bg-[#6F42C1] text-white">
            Avg Time Spent
          </option>
        </select>
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}
