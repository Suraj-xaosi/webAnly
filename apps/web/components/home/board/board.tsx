"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { fetchAnalytics } from "../../../store/slices/analyticsSlice";

import BrowsersChart from "./charts/BrowserChart";
import ViewChart from "./charts/ViewChart";
import CountriesChart from "./charts/CountryChart";
import DevicesChart from "./charts/DeviceChart";
import PagesChart from "./charts/PageChart";

export default function Dashboard() {
  const dispatch = useAppDispatch();

  const sites = useAppSelector((s) => s.site.sites);
  const { siteId, date } = useAppSelector((s) => s.selectedDateSiteId);

  useEffect(() => {
    if (siteId && date) {
      dispatch(fetchAnalytics({ siteId, date }));
    }
  }, [siteId, date]);

  if (!siteId) return null;

  return (
    <div className="bg-[#181c23] min-height-screen text-white p-8">
      <ViewChart />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 mt-1">
        <PagesChart />
        <CountriesChart />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 mt-1">
        <BrowsersChart />
        <DevicesChart />
      </div>
    </div>
  );
}
