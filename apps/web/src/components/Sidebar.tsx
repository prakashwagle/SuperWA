"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Inbox", icon: "📥" },
  { href: "/triage", label: "Triage", icon: "🏷️" },
  { href: "/search", label: "Search", icon: "🔍" },
  { href: "/connect", label: "Connect", icon: "🔗" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r border-border bg-surface flex flex-col shrink-0">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold">
          <span className="text-accent">Super</span>WA
        </h1>
        <p className="text-xs text-muted mt-1">Zero Inbox</p>
      </div>
      <nav className="flex-1 p-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent/10 text-accent-dark"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
