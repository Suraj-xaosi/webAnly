"use client";
import { ChangeEvent, ReactNode } from "react";

interface InputProps {
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: ReactNode;
  className?: string;
  name?: string;
  max?: string;
}

export default function AppInput({
  type = "text",
  value,
  onChange,
  placeholder = "",
  disabled = false,
  error,
  className = "",
  name,
  max,
}: InputProps) {
  return (
    <div className="w-full">
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        name={name}
        max={max}
        className={`w-full rounded-xl px-4 py-3 bg-white/20 text-white placeholder-white/70 border border-white/30 focus:outline-none focus:border-white/60 focus:ring-2 focus:ring-white/40 transition ${className} ${error ? "border-red-400" : ""}`}
      />
      {error && (
        <p className="text-red-300 text-sm bg-red-500/10 p-2 rounded mt-1">
          {error}
        </p>
      )}
    </div>
  );
}