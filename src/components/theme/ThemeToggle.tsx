"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/theme/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      aria-label="Toggle theme"
      onClick={toggle}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-[var(--surface-glass)] backdrop-blur-xl shadow hover:opacity-90 transition"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      <span className="text-sm">{theme === "dark" ? "Light" : "Dark"}</span>
    </button>
  );
}



