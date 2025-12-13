"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchAnalytics } from "../../../store/slices/analyticSlice";

import BrowsersChart from "./charts/BrowserChart";
import ViewChart from "./charts/ViewChart";
import CountriesChart from "./charts/CountryChart";
import DevicesChart from "./charts/DeviceChart";
import PagesChart from "./charts/PageChart";

const POLL_INTERVAL = 30_000; // 30 seconds

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { siteId, date } = useAppSelector((s) => s.selectedDateSiteId);

  useEffect(() => {
    if (!siteId || !date) return;

    // 🔹 initial fetch
    dispatch(fetchAnalytics({ siteId, date }));

    // 🔁 polling every 40 sec
    const intervalId = setInterval(() => {
      dispatch(fetchAnalytics({ siteId, date }));
    }, POLL_INTERVAL);

    // 🧹 cleanup on unmount / siteId/date change
    return () => {
      clearInterval(intervalId);
    };
  }, [siteId, date, dispatch]);

  if (!siteId) return null;

  return (
    <div className="w-full min-h-screen p-2 sm:p-4 md:p-8 flex flex-col gap-6">
      <div className="w-full">
        <ViewChart />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PagesChart />
        <CountriesChart />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BrowsersChart />
        <DevicesChart />
      </div>
    </div>
  );
}
