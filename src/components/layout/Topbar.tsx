"use client";

import ThemeToggle from "@/components/theme/ThemeToggle";
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSidebarState } from "@/components/layout/AppShell";

export default function Topbar() {
  const { isCollapsed, toggleCollapsed } = useSidebarState();
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-6 py-3 backdrop-blur-xl bg-[color:var(--surface-glass)] border-b border-white/10"
      style={{ height: "var(--topbar-h)" }}
    >
      <div className="flex items-center gap-3">
        <button
          aria-label="Toggle sidebar"
          className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-white/10 bg-[var(--surface-glass)]"
          onClick={toggleCollapsed}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

function UserMenu() {
  return (
    <button className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-white/10 bg-[var(--surface-glass)] backdrop-blur-xl shadow hover:opacity-90 transition">
      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-[var(--panel-start)] to-[var(--panel-end)] grid place-items-center text-[10px]">MJ</div>
      <span className="hidden sm:inline text-sm">Account</span>
      <ChevronDown size={14} />
    </button>
  );
}



