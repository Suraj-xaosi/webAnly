"use client";

import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";

import BrowsersChart from "./charts/browserChart";
import ViewChart from "./charts/viewChart";
import CountriesChart from "./charts/countryChart";
import DevicesChart from "./charts/deviceChart";
import PagesChart from "./charts/pageChart";

import { fetchTimeseries } from "../../../store/slices/analytics/timeseriesSlice";
import { fetchBreakdown } from "../../../store/slices/analytics/breakdownSlice";

const POLL_INTERVAL = 30_000; // 30 seconds

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { siteId, fromdate, todate, interval } =
    useAppSelector((s) => s.selectedDateSiteId);

  useEffect(() => {
    if (!siteId || !fromdate || !todate || !interval) return;

    const fetchAll = () => {
      dispatch(fetchTimeseries({ siteId, from: fromdate, to: todate, interval }));
      dispatch(fetchBreakdown({ siteId, from: fromdate, to: todate, dimension: "page" }));
      dispatch(fetchBreakdown({ siteId, from: fromdate, to: todate, dimension: "country" }));
      dispatch(fetchBreakdown({ siteId, from: fromdate, to: todate, dimension: "browser" }));
      dispatch(fetchBreakdown({ siteId, from: fromdate, to: todate, dimension: "device" }));
    };
    fetchAll();

    const toMs = new Date(todate).getTime();
    const isLiveRange = Date.now() - toMs < 60_000;
    if (!isLiveRange) return;


    const intervalId = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(intervalId);

  }, [siteId, fromdate, todate, interval, dispatch]);

  if (!siteId) return null;

  return (
    <div className="w-full min-h-screen p-2 sm:p-4 md:p-8 flex flex-col gap-6">
      <ViewChart />

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
