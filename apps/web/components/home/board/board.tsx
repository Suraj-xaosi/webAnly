"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";


import BrowsersChart from "./charts/BrowserChart";
import ViewChart from "./charts/ViewChart";
import CountriesChart from "./charts/CountryChart";
import DevicesChart from "./charts/DeviceChart";
import PagesChart from "./charts/PageChart";
import { fetchTimeseries } from "../../../store/slices/adv/timeseriesSlice";
import { fetchBreakdown } from "../../../store/slices/adv/breakdownSlice";


const POLL_INTERVAL = 30_000; // 30 seconds

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { siteId, fromdate, todate } = useAppSelector((s) => s.selectedDateSiteId);

  useEffect(() => {
    if (!siteId || !fromdate || !todate) return;

    dispatch(fetchTimeseries({ siteId, from: fromdate, to: todate, interval: "day" }));
    dispatch(fetchBreakdown({ siteId, from: fromdate, to: todate, dimension: "page" }));
    dispatch(fetchBreakdown({ siteId, from: fromdate, to: todate, dimension: "country" }));
    dispatch(fetchBreakdown({ siteId, from: fromdate, to: todate, dimension: "browser" }));
    dispatch(fetchBreakdown({ siteId, from: fromdate, to: todate, dimension: "device" }));

    // 🔁 polling every 40 sec
    const intervalId = setInterval(() => {
      dispatch(fetchTimeseries({ siteId, from: fromdate, to: todate, interval: "day" }));
      dispatch(fetchBreakdown({ siteId, from: fromdate, to: todate, dimension: "page" }));
      dispatch(fetchBreakdown({ siteId, from: fromdate, to: todate, dimension: "country" }));
      dispatch(fetchBreakdown({ siteId, from: fromdate, to: todate, dimension: "browser" }));
      dispatch(fetchBreakdown({ siteId, from: fromdate, to: todate, dimension: "device" }));
    }, POLL_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [siteId, fromdate,todate, dispatch]);

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
