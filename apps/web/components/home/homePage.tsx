"use client";


import React, { useEffect, useState } from "react";
import Sidebar from "./sidebar/sidebar";
import { fetchSiteInfo } from "../../store/slices/sitesSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";


import Board from "./board/board";
import { setSiteId } from "../../store/slices/selectedDateSiteSlice";
import Header from "./header/header";



export default function HomePage() {

  const dispatch = useAppDispatch();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const sites = useAppSelector((s) => s.site.sites);

  const selected = useAppSelector((s) => s.selectedDateSiteId);

  useEffect(() => {

    dispatch(fetchSiteInfo());

  }, []);



  useEffect(() => {

    if (sites.length > 0 && !selected.siteId && sites[0]?.id) {  

      dispatch(setSiteId(sites[0].id));

    }

  }, [sites]);



  return (

    <div className="relative flex h-screen w-full bg-gradient-to-br from-[#6F42C1] via-[#8B5CF6] to-[#A78BFA] text-white overflow-hidden">



      {/* Sidebar */}

      <div className={`h-full transition-all duration-300 ${sidebarOpen ? "w-60" : "w-0"}`}>

        {sidebarOpen && (

          <div className="relative shadow-2xl h-full">

            <Sidebar />



            <button

              onClick={() => setSidebarOpen(false)}

              className="absolute bottom-14 -right-4 bg-white text-[#6F42C1] px-2 py-1 rounded-lg text-xs font-semibold"

            >

              ❮

            </button>

          </div>

        )}

      </div>



      {!sidebarOpen && (

        <button

          onClick={() => setSidebarOpen(true)}

          className="absolute bottom-14 left-4 bg-white/100 text-[#6F42C1] px-2 py-1 rounded-lg text-sm font-semibold"

        >

          ❯

        </button>

      )}



      {/* MAIN */}

      <main className="flex-1 overflow-auto">


        <Header />


        {sites.length > 0 ? (

          <Board />

        ) : (

          <h1 className="text-4xl font-extrabold p-12">

            webAnly - Your Web Analytics Dashboard

          </h1>

        )}

      </main>

    </div>

  );

}