// apps/web/Components/cards/popupCard.tsx
"use client";
import { ReactNode } from "react";

interface PopupCardProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

export default function PopupCard({
  open,
  onClose,
  children,
  className = "",
}: PopupCardProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm bg-black/40">
      <div className={`relative bg-white/10 p-6 rounded-2xl shadow-2xl border border-purple-200 ${className}`}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white bg-[#8B5CF6] hover:bg-[#6F42C1] rounded-full font-bold p-2 w-8 h-8 flex items-center justify-center shadow-md transition"
          aria-label="Close"
        >
          ×
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