"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "./sidebar/sidebar";
import {fetchSiteInfo} from "../../store/slices/sitesSlice";
import { useAppDispatch } from "../../store/hooks";
import Board from "./board/board";

export default function HomePage() {
  const dispatch = useAppDispatch();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useEffect(() => {
    dispatch(fetchSiteInfo());
  },[]);

  return (
    <div className="relative flex h-screen w-full bg-gradient-to-br from-[#6F42C1] via-[#8B5CF6] to-[#A78BFA] text-white overflow-hidden ">

      {/* Sidebar */}
      <div
        className={`h-full transition-all duration-300 ${
          sidebarOpen ? "w-60" : "w-0"
        }`}
      >
        {sidebarOpen && (
          <div className="relative shadow-2xl h-full transition-all duration-300">
            <Sidebar />

            {/* Hide Button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 -right-4 bg-white text-[#6F42C1] shadow-xl px-2 py-1 rounded-lg text-xs font-semibold hover:bg-[#F3E8FF] transition"
            >
              ❮
            </button>
          </div>
        )}
      </div>

      {/* Show Sidebar Button */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-4 left-4 bg-white/80 backdrop-blur-md text-[#6F42C1] shadow-xl px-2 py-1 rounded-lg text-sm font-semibold hover:bg-white transition"
        >
          ❯
        </button>
      )}

      {/* Main Content */}
      <main className="flex-1 p-12 overflow-auto">
        <h1 className="text-4xl font-extrabold mb-6 drop-shadow-xl tracking-wide">
          Dashboard
          <Board/>
        </h1>
      </main>
    </div>
  );
}
