"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchAnalytics } from "../../../store/slices/analyticSlice";

import BrowsersChart from "./charts/BrowserChart";
import ViewChart from "./charts/ViewChart";
import CountriesChart from "./charts/CountryChart";
import DevicesChart from "./charts/DeviceChart";
import PagesChart from "./charts/PageChart";

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { siteId, date } = useAppSelector((s) => s.selectedDateSiteId);

  useEffect(() => {
    if (siteId && date) {
      dispatch(fetchAnalytics({ siteId, date }));
    }
  }, [siteId, date]);

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
