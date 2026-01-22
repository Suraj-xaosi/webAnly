"use client";

import {useState} from "react";
import Controls from "./contol";


export default function Header() {
  const [opened, setOpened] = useState(false);

  return (
    <header className="w-full bg-gradient-to-r from-[#6F42C1] to-[#8B5CF6] shadow-lg shadow-purple-800/30 px-4 sm:px-8 py-4 flex items-center justify-between relative">
      {/* Left: Brand */}
      <h1 className="text-3xl font-extrabold tracking-wide drop-shadow text-white">webAnly</h1>

      {/* Controls Button */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpened(!opened)}
        className="text-white bg-gradient-to-r from-[#8B5CF6] to-[#6F42C1] hover:from-[#6F42C1] hover:to-[#8B5CF6] rounded-xl px-5 py-2 font-semibold shadow-md transition absolute right-4 top-4 sm:static sm:right-0 sm:top-0 cursor-pointer"
      >
        Controls
      </div>

      {/* Controls Modal */}
      <Controls open={opened} onClose={() => setOpened(false)} />
      <style jsx>{`
        .animate-pop {
          animation: pop 0.25s ease-out;
        }

        @keyframes pop {
          from {
            transform: scale(0.85);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </header>
  );
}