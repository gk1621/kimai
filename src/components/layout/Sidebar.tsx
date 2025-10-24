"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Calendar, FileText, Gauge, Layers, Users, Settings as SettingsIcon } from "lucide-react";
import React from "react";
import { useSidebarState } from "@/components/layout/AppShell";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const MAIN: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: <Gauge size={16} /> },
  { href: "/leads", label: "Leads", icon: <Users size={16} /> },
  { href: "/analytics", label: "Analytics", icon: <BarChart3 size={16} /> },
  { href: "/calendar", label: "Calendar", icon: <Calendar size={16} /> },
  { href: "/settings", label: "Settings", icon: <SettingsIcon size={16} /> },
];

const RESOURCES: NavItem[] = [
  { href: "/documents", label: "Documents", icon: <FileText size={16} /> },
  { href: "/conflicts", label: "Conflicts", icon: <Layers size={16} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed } = useSidebarState();

  return (
    <aside 
      className="sticky top-0 self-start h-screen block"
      style={{ 
        width: isCollapsed ? "76px" : "260px",
        transition: "width 200ms ease"
      }}
    >
      <nav className="glass-card p-3 h-full flex flex-col w-full">
        {/* Brand moved here */}
        <div className={`flex items-center gap-3 mb-2 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[var(--panel-start)] to-[var(--panel-end)] grid place-items-center text-sm font-bold">K</div>
          {!isCollapsed && <span className="font-semibold tracking-wide">KIMAI</span>}
        </div>
        <Section title="Navigation" collapsed={isCollapsed}>
          {MAIN.map(item => (
            <SidebarLink key={item.href} item={item} active={pathname?.startsWith(item.href) ?? false} collapsed={isCollapsed} />
          ))}
        </Section>
        <div className="mt-4" />
        <Section title="Resources" collapsed={isCollapsed}>
          {RESOURCES.map(item => (
            <SidebarLink key={item.href} item={item} active={pathname?.startsWith(item.href) ?? false} collapsed={isCollapsed} />
          ))}
        </Section>
        <div className="flex-1" />
        <div className="px-2 py-2 text-[10px] uppercase tracking-wide opacity-50">v0.1.0</div>
      </nav>
    </aside>
  );
}

function Section({ title, collapsed, children }: { title: string; collapsed: boolean; children: React.ReactNode }) {
  return (
    <div>
      {!collapsed && <div className="px-2 py-2 text-xs uppercase tracking-wide opacity-70">{title}</div>}
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function SidebarLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors ${
        active ? "bg-white/10" : ""
      } ${collapsed ? "justify-center" : ""}`}
      title={collapsed ? item.label : undefined}
    >
      <span className="opacity-80">{item.icon}</span>
      {!collapsed && <span className="text-sm">{item.label}</span>}
    </Link>
  );
}


