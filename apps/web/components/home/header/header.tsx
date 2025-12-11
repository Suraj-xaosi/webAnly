"use client";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setSiteId, setDate } from "../../../store/slices/selectedDateSiteSlice";
import { useEffect, useState } from "react";

export default function Header() {
  const dispatch = useAppDispatch();

  const sites = useAppSelector((s) => s.site.sites);
  const selectedSiteId = useAppSelector((s) => s.selectedDateSiteId.siteId);
  const selectedDate = useAppSelector((s) => s.selectedDateSiteId.date);

  // Local input state for date
  const [dateInput, setDateInput] = useState("");

  // Set default input = today's date OR redux date
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    setDateInput(selectedDate || today || "");

    // If redux has no date, set default date once
    if (!selectedDate) {
      dispatch(setDate(today || ""));
    }
  }, [selectedDate]);

  // Handle date submission
  const handleDateSubmit = () => {
    if (!dateInput) return;

    // yyyy-mm-dd validation
    const isValid = /^\d{4}-\d{2}-\d{2}$/.test(dateInput);
    if (!isValid) return alert("Please enter a valid date (YYYY-MM-DD)");

    dispatch(setDate(dateInput));
  };

  return (
    <header className=" flex bg-gradient-to-br from-[#6F42C1] via-[#8B5CF6] to-[#A78BFA] justify-between items-center px-6 py-4 text-white shadow-lg">

      {/* Left: Brand */}
      <h1 className="text-2xl font-bold right-5 tracking-wide">webAnly</h1>

      {/* Right Controls */}
      <div className="flex items-center gap-4">

        {/* Site Selector */}
        {sites.length > 0 && (
          <select
            value={selectedSiteId || ""}
            onChange={(e) => dispatch(setSiteId(e.target.value))}
            className="bg-[#A78BFA] text-white px-4 py-2 rounded-lg border border-purple-400 focus:ring-2 focus:ring-purple-500"
          >
            {sites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.domain}
              </option>
            ))}
          </select>
        )}

        {/* Date Input */}
        <input
          type="date"
          value={dateInput}
          max={new Date().toISOString().split("T")[0]} 
          onChange={(e) => setDateInput(e.target.value)}
          className="bg-[#A78BFA] text-white px-4 py-2 rounded-lg border border-purple-400 focus:ring-2 focus:ring-purple-500"
        />

        {/* Apply Button */}
        <button
          onClick={handleDateSubmit}
          className="bg-[#8B5CF6] hover:bg-purple-700 px-4 py-2 rounded-lg font-semibold"
        >
          Apply
        </button>

      </div>
    </header>
  );
}
