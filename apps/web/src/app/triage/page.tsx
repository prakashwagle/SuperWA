"use client";

import { useEffect, useState, useCallback } from "react";
import { chats as chatsApi, type ChatRow } from "../../lib/api";

const categories = ["personal", "business", "group", "channel", "spam", "uncategorized"] as const;

export default function TriagePage() {
  const [chatList, setChatList] = useState<ChatRow[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const result = await chatsApi.list({ status: "inbox" });
        setChatList(result);
      } catch (err) {
        console.error("Failed to load:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const current = chatList[currentIndex];

  const handleAction = useCallback(async (status: string, category?: string) => {
    const chat = chatList[currentIndex];
    if (!chat) return;
    await chatsApi.triage(chat.id, {
      status,
      ...(category ? { category } : {}),
    });
    setCurrentIndex((i) => i + 1);
  }, [chatList, currentIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case "d": handleAction("done"); break;
        case "r": handleAction("need_reply"); break;
        case "s": handleAction("snoozed"); break;
        case "f": handleAction("fyi"); break;
        // Category shortcuts (with Shift)
        case "1": handleAction("inbox", "personal"); break;
        case "2": handleAction("inbox", "business"); break;
        case "3": handleAction("inbox", "group"); break;
        case "4": handleAction("inbox", "channel"); break;
        case "5": handleAction("inbox", "spam"); break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleAction]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted">Loading triage queue...</p>
      </div>
    );
  }

  if (!current || currentIndex >= chatList.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-5xl mb-4">🎯</p>
        <p className="text-2xl font-bold">All triaged!</p>
        <p className="text-muted mt-2">
          {chatList.length === 0
            ? "No chats in inbox to triage."
            : `Processed ${chatList.length} chats.`}
        </p>
      </div>
    );
  }

  const remaining = chatList.length - currentIndex;

  return (
    <div className="flex flex-col items-center justify-center h-full p-6">
      <p className="text-sm text-muted mb-4">
        {remaining} remaining in inbox
      </p>

      {/* Triage Card */}
      <div className="w-full max-w-lg bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">
            {current.is_channel ? "📢" : current.is_group ? "👥" : "💬"}
          </span>
          <div>
            <h2 className="text-xl font-bold">{current.name}</h2>
            <p className="text-sm text-muted">
              {current.unread_count > 0 ? `${current.unread_count} unread` : "No unread messages"}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted bg-background rounded-lg p-3 mb-6">
          {current.last_message || "No recent messages"}
        </p>

        {/* Category buttons */}
        <p className="text-xs text-muted mb-2 font-medium">CATEGORIZE</p>
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleAction("inbox", cat)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border border-border hover:bg-surface-hover transition-colors capitalize"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <p className="text-xs text-muted mb-2 font-medium">ACTION</p>
        <div className="grid grid-cols-4 gap-2">
          <button
            onClick={() => handleAction("done")}
            className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:bg-green-50 hover:border-green-200 transition-colors"
          >
            <span className="text-xl">✓</span>
            <span className="text-xs">Done</span>
          </button>
          <button
            onClick={() => handleAction("need_reply")}
            className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:bg-blue-50 hover:border-blue-200 transition-colors"
          >
            <span className="text-xl">↩</span>
            <span className="text-xs">Reply</span>
          </button>
          <button
            onClick={() => handleAction("snoozed")}
            className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:bg-yellow-50 hover:border-yellow-200 transition-colors"
          >
            <span className="text-xl">💤</span>
            <span className="text-xs">Snooze</span>
          </button>
          <button
            onClick={() => handleAction("fyi")}
            className="flex flex-col items-center gap-1 p-3 rounded-xl border border-border hover:bg-purple-50 hover:border-purple-200 transition-colors"
          >
            <span className="text-xl">ℹ</span>
            <span className="text-xs">FYI</span>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-lg mt-6">
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full transition-all duration-300"
            style={{ width: `${(currentIndex / chatList.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Keyboard shortcut hints */}
      <div className="w-full max-w-lg mt-4 text-center text-xs text-muted">
        <span className="opacity-70">Keyboard: </span>
        <Kbd>d</Kbd> Done
        <span className="mx-1.5">·</span>
        <Kbd>r</Kbd> Reply
        <span className="mx-1.5">·</span>
        <Kbd>s</Kbd> Snooze
        <span className="mx-1.5">·</span>
        <Kbd>f</Kbd> FYI
        <span className="mx-1.5">·</span>
        <Kbd>1-5</Kbd> Categorize
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-block px-1.5 py-0.5 mx-0.5 rounded border border-border bg-surface font-mono text-[10px]">
      {children}
    </kbd>
  );
}
