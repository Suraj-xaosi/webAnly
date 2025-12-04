"use client";

import React, { useState } from "react";
import Sidebar from "./sidebar/sidebar";

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="relative flex h-screen w-full bg-gradient-to-br from-[#6F42C1] via-[#8B5CF6] to-[#A78BFA] text-white overflow-hidden ">

      {/* Sidebar */}
      <div
        className={`h-full transition-all duration-300 ${
          sidebarOpen ? "w-60" : "w-0"
        }`}
      >
        {sidebarOpen && (
          <div className="relative shadow-2xl h-full">
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
        </h1>

        <p className="text-lg opacity-90">
          Your analytics and website insights will appear here.
        </p>

        {/* Example content block */}
        <div className="mt-10 p-10 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
          <h2 className="text-3xl font-bold mb-3">Welcome Back 👋</h2>
          <p className="text-md opacity-90 leading-relaxed">
            Use the sidebar to add sites, remove them, or explore analytics.
          </p>

          <div className="mt-5 p-5 rounded-xl bg-white/5 border border-white/10">
            <p className="opacity-80">
              You can place charts, cards, and insights inside this container.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
