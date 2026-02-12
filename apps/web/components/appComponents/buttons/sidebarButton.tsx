"use client";

import { ReactNode, useState } from "react";
import PopupCard from "../cards/popupCard";
interface SidebarButtonProps {
  label: ReactNode;
  icon?: ReactNode;
  children: ReactNode; // Popup content
  className?: string;
}

export default function SidebarButton({
  label,
  icon,
  children,
  className = "",
}: SidebarButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={e => e.key === "Enter" && setOpen(true)}
        className={`p-3 shadow-md rounded-lg mb-3 cursor-pointer transition-all bg-white/5 hover:bg-white/20 border border-white/10 ${className}`}
      >
        {icon && <span className="mr-2">{icon}</span>}
        <span className="font-medium">{label}</span>
      </div>
      {open && (
        <PopupCard open={open} onClose={() => setOpen(false)}>
          {children}
        </PopupCard>
      )}
    </>
  );
}