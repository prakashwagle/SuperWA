"use client";

import { useEffect, useState } from "react";
import { chats as chatsApi, stats as statsApi, type ChatRow, type Stats } from "../lib/api";
import { ChatList } from "../components/ChatList";
import { InboxStats } from "../components/InboxStats";

export default function InboxPage() {
  const [chatList, setChatList] = useState<ChatRow[]>([]);
  const [statsData, setStatsData] = useState<Stats | null>(null);
  const [filter, setFilter] = useState<string>("inbox");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [chatsResult, statsResult] = await Promise.all([
          chatsApi.list({ status: filter }),
          statsApi.get(),
        ]);
        setChatList(chatsResult);
        setStatsData(statsResult);
      } catch (err) {
        console.error("Failed to load inbox:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [filter]);

  const handleTriage = async (chatId: string, status: string) => {
    await chatsApi.triage(chatId, { status });
    setChatList((prev) => prev.filter((c) => c.id !== chatId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted">Loading inbox...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Inbox</h2>
        <div className="flex gap-2">
          {["inbox", "need_reply", "fyi", "done"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filter === s
                  ? "bg-accent text-white"
                  : "bg-surface border border-border text-muted hover:text-foreground"
              }`}
            >
              {s.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {statsData && <InboxStats stats={statsData} />}

      {chatList.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🎉</p>
          <p className="text-lg font-medium">
            {filter === "inbox" ? "Zero Inbox achieved!" : `No ${filter.replace("_", " ")} chats`}
          </p>
          <p className="text-muted text-sm mt-1">
            {filter === "inbox"
              ? "All caught up. Nice work."
              : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <ChatList chats={chatList} onTriage={handleTriage} />
      )}
    </div>
  );
}
