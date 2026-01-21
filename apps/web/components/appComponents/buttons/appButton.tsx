"use client"

import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export const AppButton = ({
  onClick,
  children,
  type="submit",
  disabled = false,
  loading = false,
  className = "",
}: ButtonProps) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    className={`w-full py-3 rounded-xl bg-gradient-to-r from-[#8B5CF6] to-[#6F42C1]
      text-white font-semibold shadow-lg shadow-purple-800/30
      ${loading ? "opacity-60 cursor-not-allowed" : ""}
      ${className}`}
  >
    {loading ? "Loading..." : children}
  </button>
);