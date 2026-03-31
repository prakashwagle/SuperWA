"use client";

import Link from "next/link";
import type { ChatRow } from "../lib/api";

interface ChatListProps {
  chats: ChatRow[];
  onTriage?: (chatId: string, status: string) => void;
}

const categoryColors: Record<string, string> = {
  personal: "bg-blue-100 text-blue-700",
  business: "bg-purple-100 text-purple-700",
  group: "bg-green-100 text-green-700",
  channel: "bg-orange-100 text-orange-700",
  spam: "bg-red-100 text-red-700",
  uncategorized: "bg-gray-100 text-gray-600",
};

export function ChatList({ chats, onTriage }: ChatListProps) {
  return (
    <div className="space-y-2">
      {chats.map((chat) => (
        <div
          key={chat.id}
          className="bg-surface border border-border rounded-xl p-4 hover:bg-surface-hover transition-colors"
        >
          <div className="flex items-start justify-between">
            <Link href={`/chat/${encodeURIComponent(chat.id)}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-lg">
                  {chat.is_channel ? "📢" : chat.is_group ? "👥" : "💬"}
                </span>
                <h3 className="font-semibold truncate">{chat.name}</h3>
                {chat.unread_count > 0 && (
                  <span className="bg-accent text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {chat.unread_count}
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[chat.category] ?? categoryColors.uncategorized}`}>
                  {chat.category}
                </span>
              </div>
              <p className="text-sm text-muted mt-1 truncate">{chat.last_message}</p>
            </Link>

            {onTriage && (
              <div className="flex gap-1 ml-3 shrink-0">
                <TriageButton label="✓" title="Done" onClick={() => onTriage(chat.id, "done")} />
                <TriageButton label="💤" title="Snooze" onClick={() => onTriage(chat.id, "snoozed")} />
                <TriageButton label="↩" title="Need Reply" onClick={() => onTriage(chat.id, "need_reply")} />
                <TriageButton label="ℹ" title="FYI" onClick={() => onTriage(chat.id, "fyi")} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted">
            <time>{formatTime(chat.last_message_timestamp)}</time>
          </div>
        </div>
      ))}
    </div>
  );
}

function TriageButton({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg border border-border hover:bg-surface-hover transition-colors text-sm"
    >
      {label}
    </button>
  );
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60_000) return "just now";
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return date.toLocaleDateString();
}
