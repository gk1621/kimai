"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

type BreadcrumbsProps = {
  className?: string;
  lastLabel?: string;
};

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  leads: "Leads",
  analytics: "Analytics",
  calendar: "Calendar",
  settings: "Settings",
  documents: "Documents",
  conflicts: "Conflicts",
  agent: "Agent",
  knowledge: "Knowledge",
  twilio: "Twilio",
};

export default function Breadcrumbs({ className, lastLabel }: BreadcrumbsProps) {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null; // only show on subpages

  const items = segments.map((seg, idx) => {
    const href = "/" + segments.slice(0, idx + 1).join("/");
    const isLast = idx === segments.length - 1;
    const label = isLast && lastLabel ? lastLabel : (LABELS[seg] ?? titleCase(seg));
    return { href, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center gap-1 text-sm opacity-80">
        {items.map((item, i) => (
          <li key={item.href} className="flex items-center gap-1">
            {item.isLast ? (
              <span className="font-medium opacity-90">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:underline">
                {item.label}
              </Link>
            )}
            {i < items.length - 1 && <ChevronRight size={14} className="opacity-60" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function titleCase(slug: string): string {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b([a-z])/g, (_, c: string) => c.toUpperCase());
}


