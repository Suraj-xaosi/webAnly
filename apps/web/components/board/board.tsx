"use client";
"use client";

import { useEffect } from "react";
import { useAppDispatch } from "../../store/hooks";
import { fetchAnalytics } from "../../store/slices/analyticsSlice";
import BrowsersChart from "./charts/BrowserChart";
import ViewChart from "./charts/ViewChart";
import CountriesChart from "./charts/CountryChart";
import DevicesChart from "./charts/DeviceChart";
import PagesChart from "./charts/PageChart";





export default function Dashboard() {

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchAnalytics({
      domain: "mysite.com",
      date: "2025-10-10"
    }));
  }, []);

  return (
    <div className="bg-[#181c23] min-h-screen text-white p-8">
        <div>
          <ViewChart  />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2  mt-1">
            <PagesChart />
            <CountriesChart />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2  mt-1">
            <BrowsersChart />
            <DevicesChart />
          </div>

        </div>
    </div>
    
    
  );
}