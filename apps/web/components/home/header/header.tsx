"use client";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setSiteId, setFromDate, setToDate } from "../../../store/slices/selectedDateSiteSlice";
import { useEffect, useState } from "react";

export default function Header() {
  const dispatch = useAppDispatch();

  const sites = useAppSelector((s) => s.site.sites);
  const selectedSiteId = useAppSelector((s) => s.selectedDateSiteId.siteId);
  const selectedDate = useAppSelector((s) => s.selectedDateSiteId.fromdate);
  const todate = useAppSelector((s) => s.selectedDateSiteId.todate);

  // Local input state for date
  const [fromdateInput, setDateInput] = useState("");
  const [todateInput, setToDateInput] = useState("");

  // Set default input = today's date OR redux date
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    setDateInput(selectedDate || today || "");
    setToDateInput(todate || today || "");

    // If redux has no date, set default date once
    if (!selectedDate) {
      dispatch(setFromDate(today || ""));
      dispatch(setToDate(today || ""));
    }
  }, [selectedDate]);

  // Handle date submission
  const handleDateSubmit = () => {
    if (!fromdateInput || !todateInput) return;

    // yyyy-mm-dd validation
    const isValid = /^\d{4}-\d{2}-\d{2}$/.test(fromdateInput) && /^\d{4}-\d{2}-\d{2}$/.test(todateInput);
    if (!isValid) return alert("Please enter a valid date (YYYY-MM-DD)");

    dispatch(setFromDate(fromdateInput));
    dispatch(setToDate(todateInput));
  };

    return (
      <header className="w-full flex flex-col sm:flex-row bg-[#6F42C1] justify-between items-center px-4 sm:px-8 py-4 text-white shadow-lg shadow-purple-800/30 gap-4 sm:gap-0">
        {/* Left: Brand */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide drop-shadow mb-2 sm:mb-0">webAnly</h1>

        {/* Right Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
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
          {/* Apply Button */}
          <button
            onClick={handleDateSubmit}
            className="bg-gradient-to-r from-[#8B5CF6] to-[#6F42C1] hover:from-[#6F42C1] hover:to-[#8B5CF6] px-6 py-2 rounded-lg font-semibold shadow-md transition text-white w-full sm:w-auto"
          >
            Apply
          </button>
        </div>
      </header>
    );
}
