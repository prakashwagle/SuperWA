"use client";

import { useEffect, useState, use } from "react";
import { chats as chatsApi, type ChatRow, type MessageRow } from "../../../lib/api";
import { MessageBubble } from "../../../components/MessageBubble";

export default function ChatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const chatId = decodeURIComponent(id);

  const [chat, setChat] = useState<ChatRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [chatData, msgData] = await Promise.all([
          chatsApi.get(chatId),
          chatsApi.messages(chatId),
        ]);
        setChat(chatData);
        setMessages(msgData.reverse()); // Show oldest first
      } catch (err) {
        console.error("Failed to load chat:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [chatId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted">Loading chat...</p>
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted">Chat not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-border bg-surface p-4 flex items-center gap-3">
        <span className="text-2xl">
          {chat.is_channel ? "📢" : chat.is_group ? "👥" : "💬"}
        </span>
        <div>
          <h2 className="font-bold">{chat.name}</h2>
          <p className="text-xs text-muted capitalize">{chat.category}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-muted py-8">No messages synced yet</p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
      </div>

      {/* Info bar */}
      <div className="border-t border-border bg-surface p-3 text-center text-xs text-muted">
        Messages are read-only. Open WhatsApp to reply.
      </div>
    </div>
  );
}
