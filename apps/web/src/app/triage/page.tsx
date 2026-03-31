"use client";

import { useEffect, useState } from "react";
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

  const handleAction = async (status: string, category?: string) => {
    if (!current) return;
    await chatsApi.triage(current.id, {
      status,
      ...(category ? { category } : {}),
    });
    setCurrentIndex((i) => i + 1);
  };

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
    </div>
  );
}
