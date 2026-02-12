"use client";

import { ReactNode } from "react";

interface PopupCardProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function PopupCard({
  open,
  onClose,
  children,
}: PopupCardProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-black/40">
      <div className="relative bg-gradient-to-br from-[#8B5CF6] to-[#6F42C1] p-8 w-full max-w-md rounded-3xl shadow-2xl animate-pop border border-purple-200 flex flex-col gap-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white bg-[#6F42C1] hover:bg-[#8B5CF6] rounded-full font-bold p-2 w-8 h-8 flex items-center justify-center shadow-md transition"
          aria-label="Close"
        >
          X
        </button>
        {children}
      </div>
      <style jsx>{`
        .animate-pop {
          animation: pop 0.25s ease-out;
        }
        @keyframes pop {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}