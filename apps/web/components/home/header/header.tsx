"use client";


import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { setSiteId, setFromDate, setToDate ,setInterval} from "../../../store/slices/selectedDateSiteSlice";
import { useEffect, useState } from "react";
import PopupCard from "../../appComponents/cards/popupCard";
import AppInput from "../../appComponents/input/appInput";
import { AppButton } from "../../appComponents/buttons/appButton";

export default function Header() {
  const dispatch = useAppDispatch();

  const sites = useAppSelector((s) => s.site.sites);
  const selectedSiteId = useAppSelector((s) => s.selectedDateSiteId.siteId);
  const [opened, setOpened] = useState(false);

  // Local input state for date
  const [fromdateInput, setDateInput] = useState("");
  const [todateInput, setToDateInput] = useState("");
  const [interval, setlocalInterval] = useState("hour");

  const handleDateSubmit = () => {
    if (!fromdateInput || !todateInput || !interval) return;
    if (new Date(fromdateInput) > new Date(todateInput)) {
      alert("'From' date cannot be later than 'To' date.");
      return;
    }
    
    dispatch(setFromDate(fromdateInput));

    if(interval === "hour"){
      alert("Hour interval selected, data to will be set to 'From' date.");
      dispatch(setToDate(fromdateInput));
    }else{
      dispatch(setToDate(todateInput));
    }
    
    dispatch(setInterval(interval));
    alert("Date range and interval updated!");
    setOpened(false);
  };

  return (
    <header className="w-full bg-gradient-to-r from-[#6F42C1] to-[#8B5CF6] shadow-lg shadow-purple-800/30 px-4 sm:px-8 py-4 flex items-center justify-between relative">
      {/* Left: Brand */}
      <h1 className="text-3xl font-extrabold tracking-wide drop-shadow text-white">webAnly</h1>

      {/* Controls Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpened(!opened)}
        className="text-white bg-gradient-to-r from-[#8B5CF6] to-[#6F42C1] hover:from-[#6F42C1] hover:to-[#8B5CF6] rounded-xl px-5 py-2 font-semibold shadow-md transition absolute right-4 top-4 sm:static sm:right-0 sm:top-0 cursor-pointer"
      >
        Controls
      </div>

      {/* Controls Modal */}
      <PopupCard open={opened} onClose={() => setOpened(false)}>
        <h2 className="text-2xl font-bold text-white mb-2 text-center">Controls</h2>
        {/* Site Selector */}
        {sites.length > 0 && (
          <div className="mb-2">
            <label className="block text-white font-semibold mb-2">Select Site:</label>
            <select
              value={selectedSiteId || ""}
              onChange={(e) => dispatch(setSiteId(e.target.value))}
              className="bg-[#A78BFA] text-white px-4 py-2 rounded-lg border border-purple-400 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm w-full transition"
            >
              {sites.map((site) => (
                <option key={site.id} value={site.id} className="text-black">
                  {site.domain}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Date Input */}
        <div className="flex flex-col gap-4">
          <label className="text-white font-semibold">Select Dates:</label>
          <div className="flex gap-2">
            <div className="flex flex-col w-1/2">
              <span className="text-sm text-white mb-1">From</span>
              <AppInput
                type="date"
                value={fromdateInput}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDateInput(e.target.value)}
                className="bg-[#A78BFA] text-white px-3 py-2 rounded-lg border border-purple-400 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm w-full transition"
                name="fromdate"
              />
            </div>
            <div className="flex flex-col w-1/2">
              <span className="text-sm text-white mb-1">To</span>
              <AppInput
                type="date"
                value={todateInput}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setToDateInput(e.target.value)}
                className="bg-[#A78BFA] text-white px-3 py-2 rounded-lg border border-purple-400 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm w-full transition"
                name="todate"
              />
            </div>
          </div>
        </div>
        {/* Interval Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-white font-semibold">Interval</label>
          <select
            value={interval}
            onChange={(e) => setlocalInterval(e.target.value)}
            className="bg-[#A78BFA] text-white px-4 py-2 rounded-lg border border-purple-400 focus:ring-2 focus:ring-purple-500 focus:outline-none shadow-sm w-full transition"
          >
            <option value="day">Day</option>
            <option value="hour">Hour</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
        </div>
        {/* Apply Button */}
        <AppButton type="button" onClick={handleDateSubmit} className="mt-2">
          Apply
        </AppButton>
      </PopupCard>
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
        }
      `}</style>
    </header>
  );
}