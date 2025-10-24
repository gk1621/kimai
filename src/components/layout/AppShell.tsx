"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";

type SidebarContextValue = {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarState(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebarState must be used within AppShell");
  return ctx;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // persist collapse state
  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("sidebar-collapsed") : null;
    setIsCollapsed(stored === "1");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("sidebar-collapsed", isCollapsed ? "1" : "0");
  }, [isCollapsed]);

  const toggleCollapsed = useCallback(() => setIsCollapsed(v => !v), []);

  const value = useMemo(
    () => ({ isCollapsed, toggleCollapsed }),
    [isCollapsed, toggleCollapsed]
  );

  return (
    <SidebarContext.Provider value={value}>
      <div
        className="min-h-screen grid"
        style={{
          gridTemplateColumns: isCollapsed ? "76px 1fr" : "260px 1fr",
          gap: "12px",
          transition: "grid-template-columns 200ms ease",
        }}
      >
        <Sidebar />
        <div className="flex flex-col">
          <Topbar />
          <main className="px-4 md:px-6 pt-6 pb-8 flex-1">
            <div className="mx-auto w-full max-w-6xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}


