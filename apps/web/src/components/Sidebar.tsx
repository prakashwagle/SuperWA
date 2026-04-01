"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const navItems = [
  { href: "/", label: "Inbox", icon: "📥", shortcut: "g i" },
  { href: "/triage", label: "Triage", icon: "🏷️", shortcut: "g t" },
  { href: "/search", label: "Search", icon: "🔍", shortcut: "/" },
  { href: "/connect", label: "Connect", icon: "🔗", shortcut: "g c" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // Global navigation keyboard shortcuts
  useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout>;

    function onKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // "/" focuses search
      if (e.key === "/" && !gPressed) {
        e.preventDefault();
        router.push("/search");
        return;
      }

      // "g" prefix for navigation
      if (e.key === "g" && !gPressed) {
        gPressed = true;
        gTimer = setTimeout(() => { gPressed = false; }, 1000);
        return;
      }

      if (gPressed) {
        gPressed = false;
        clearTimeout(gTimer);
        switch (e.key) {
          case "i": router.push("/"); break;
          case "t": router.push("/triage"); break;
          case "c": router.push("/connect"); break;
        }
      }

      // "?" shows keyboard shortcut help
      if (e.key === "?" && e.shiftKey) {
        e.preventDefault();
        document.getElementById("shortcut-help")?.classList.toggle("hidden");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(gTimer);
    };
  }, [router]);

  return (
    <>
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
                className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent/10 text-accent-dark"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span>{item.icon}</span>
                  {item.label}
                </span>
                <kbd className="text-[10px] opacity-40 font-mono">{item.shortcut}</kbd>
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border text-[10px] text-muted text-center">
          Press <kbd className="px-1 py-0.5 rounded border border-border bg-background font-mono">?</kbd> for shortcuts
        </div>
      </aside>

      {/* Keyboard shortcut help modal */}
      <div
        id="shortcut-help"
        className="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        onClick={(e) => {
          if (e.target === e.currentTarget) e.currentTarget.classList.add("hidden");
        }}
      >
        <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-xl">
          <h3 className="text-lg font-bold mb-4">Keyboard Shortcuts</h3>

          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs text-muted font-medium mb-2">NAVIGATION</p>
              <ShortcutRow keys="g i" desc="Go to Inbox" />
              <ShortcutRow keys="g t" desc="Go to Triage" />
              <ShortcutRow keys="g c" desc="Go to Connect" />
              <ShortcutRow keys="/" desc="Go to Search" />
              <ShortcutRow keys="?" desc="Toggle this help" />
            </div>

            <div>
              <p className="text-xs text-muted font-medium mb-2">TRIAGE ACTIONS</p>
              <ShortcutRow keys="d" desc="Mark as Done" />
              <ShortcutRow keys="r" desc="Mark as Need Reply" />
              <ShortcutRow keys="s" desc="Snooze" />
              <ShortcutRow keys="f" desc="Mark as FYI" />
            </div>

            <div>
              <p className="text-xs text-muted font-medium mb-2">CATEGORIZE (in Triage)</p>
              <ShortcutRow keys="1" desc="Personal" />
              <ShortcutRow keys="2" desc="Business" />
              <ShortcutRow keys="3" desc="Group" />
              <ShortcutRow keys="4" desc="Channel" />
              <ShortcutRow keys="5" desc="Spam" />
            </div>
          </div>

          <button
            onClick={() => document.getElementById("shortcut-help")?.classList.add("hidden")}
            className="mt-6 w-full py-2 rounded-xl border border-border text-sm text-muted hover:bg-surface-hover transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

function ShortcutRow({ keys, desc }: { keys: string; desc: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted">{desc}</span>
      <div className="flex gap-1">
        {keys.split(" ").map((k) => (
          <kbd
            key={k}
            className="inline-block px-1.5 py-0.5 rounded border border-border bg-background font-mono text-xs min-w-[22px] text-center"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}
