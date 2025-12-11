"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { useSession } from "next-auth/react";
import Logout from "./logout/logout";
import AddSite from "./siteSetting/addSite";
import Domain from "./siteSetting/domain";

export default function Sidebar() {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;

  return (
    <aside className="w-60 h-full p-5 bg-gradient-to-b from-[#6F42C1] to-[#8B5CF6] text-white shadow-xl">
      {/* User Section */}
      <div className="mb-6 p-4 rounded-xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-md">
        <h2 className="text-xl font-semibold">{session?.user?.name}</h2>
      </div>

      {/* Menu Items */}
      <div 
        role="button"
        tabIndex={0}
        
        className="p-3 shadow-md rounded-lg mb-3 cursor-pointer transition-all bg-white/5 hover:bg-white/20 border border-white/10"
      >
        <span className="font-medium"><AddSite/></span>
      </div>

      <div 
        role="button"
        tabIndex={0}
        className="p-3 shadow-md rounded-lg mb-3 cursor-pointer transition-all bg-white/5 hover:bg-white/20 border border-white/10"
      >
        <span className="font-medium w-full p-0"><Domain/></span>
      </div>

      <div 
        tabIndex={0}
        className="shadow-lg p-3 rounded-lg mb-3 cursor-pointer transition-all bg-white/5 hover:bg-white/20 border border-white/10"
      >
        
        <span className="font-medium justify-center"><Logout/></span>
        
      </div>
    </aside>
  );
}
