"use client";


import React from "react";
import { useSession } from "next-auth/react";
import AddSite from "./siteSetting/addSite";
import SiteList from "./siteSetting/siteList";
import LogoutLogic from "./logout/logout";

export default function Sidebar() {
  
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;


  return (
    <aside className="w-60 h-full p-5 bg-gradient-to-b from-[#6F42C1] to-[#8B5CF6] text-white shadow-xl">
      {/* User Section */}
      <div className="mb-6 p-4 rounded-xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-md">
        <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
      </div>


      {/* Add Site Button */}
      <AddSite />

      {/* Domain List Button */}
      <SiteList />

      {/* Logout Button */}
      <LogoutLogic />
    </aside>
  );
}
