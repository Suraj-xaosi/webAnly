"use client";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setSiteId, setFromDate, setToDate ,setInterval} from "../../../store/slices/selectedDateSiteSlice";
import { useEffect, useState } from "react";

export default function Header() {
  const dispatch = useAppDispatch();

  const sites = useAppSelector((s) => s.site.sites);
  const selectedSiteId = useAppSelector((s) => s.selectedDateSiteId.siteId);
  const [opened, setOpened] = useState(false);

  // Local input state for date
  const [fromdateInput, setDateInput] = useState("");
  const [todateInput, setToDateInput] = useState("");
  const [interval, setlocalInterval] = useState("day");

  const handleDateSubmit = () => {
    if (!fromdateInput || !todateInput || !interval) return;

    dispatch(setFromDate(fromdateInput));
    dispatch(setToDate(todateInput));
    dispatch(setInterval(interval));
    alert("Date range and interval updated!");
    setOpened(false);
  };

  return (
      <header className="w-full flex flex-col sm:flex-row bg-[#6F42C1] justify-between items-center px-4 sm:px-8 py-4 text-white shadow-lg shadow-purple-800/30 gap-4 sm:gap-0">
        {/* Left: Brand */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide drop-shadow mb-2 sm:mb-0">webAnly</h1>

        {/* Right Controls */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setOpened(!opened)}
          className="text-white bg-purple-700 hover:bg-purple-800 rounded-lg p-2 absolute top-4 right-4 sm:relative sm:top-0 sm:right-0 cursor-pointer transition"
        >
          Controls
        </div>
        {opened && (
          <div className="fixed inset-0 z-50 flex items-center justify-center  p-6 backdrop-blur-sm">
          <div className="bg-[#8B5CF6] backdrop-blur-xl p-6 w-[320px] rounded-2xl shadow-2xl animate-pop border border-purple-200">
            <div
              role="button"
              tabIndex={0}
              onClick={()=>setOpened(false)}
              className="absolute top-2 right-2 text-white bg-#8B5CF6] hover:bg-[#6F42C1] rounded-sm font-semibold p-2 "
            >
              X 
            </div>
            {/* Site Selector */}
            {sites.length > 0 && (
              <select
                value={selectedSiteId || ""}
                onChange={(e) => dispatch(setSiteId(e.target.value))}
                className="bg-[#A78BFA] text-white px-4 py-2 rounded-lg border border-purple-400 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm w-full sm:w-auto transition"
              >
                {sites.map((site) => (
                  <option key={site.id} value={site.id} className="text-black">
                    {site.domain}
                  </option>
                ))}
              </select>
            )}
            {/* Date Input */}
            <div>
              from
              <input
                type="date"
                value={fromdateInput}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDateInput(e.target.value)}
                className="bg-[#A78BFA] text-white px-4 py-2 rounded-lg border border-purple-400 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm w-full sm:w-auto transition"
              />
            </div>
            <div>
              to
              <input
                type="date"
                value={todateInput}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setToDateInput(e.target.value)}
              className="bg-[#A78BFA] text-white px-4 py-2 rounded-lg border border-purple-400 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm w-full sm:w-auto transition"
              />
            </div>
            {/*interval */}
            <div>
              Interval
              <select
                value={interval}
                onChange={(e) => setlocalInterval(e.target.value)}
                className="bg-[#A78BFA] text-white px-4 py-2 rounded-lg border border-purple-400 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm w-full sm:w-auto transition"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
            {/* Apply Button */}
            <button
              onClick={handleDateSubmit}
              className="bg-gradient-to-r from-[#8B5CF6] to-[#6F42C1] hover:from-[#6F42C1] hover:to-[#8B5CF6] px-6 py-2 rounded-lg font-semibold shadow-md transition text-white w-full sm:w-auto"
            >
              Apply
            </button>
          </div>
          </div>
        )}
        <style jsx>{`
          .animate-pop {
            animation: pop 0.25s ease-out;
          }

         @keyframes pop {
          from {
            transform: scale(0.85);
              opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }`
        }
        </style>
      </header>
  );
}