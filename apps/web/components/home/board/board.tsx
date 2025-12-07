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
  const sites = useAppSelector((s) => s.site.sites);

  if (!sites || sites.length === 0) {
    return <div>You don't have sites.</div>;
  }

  const selectedSiteId =
    useAppSelector((s) => s.selectedDateSiteId.siteId) ??
    sites[0]?.id;

  const selectedDate =
    useAppSelector((s) => s.selectedDateSiteId.date) ??
    new Date().toISOString().split("T")[0];

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!selectedSiteId) return;
    

    dispatch(
      fetchAnalytics({
        siteId: selectedSiteId,
        date: selectedDate ?? "",
      })
    );
  }, [selectedSiteId, selectedDate, dispatch]);

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
