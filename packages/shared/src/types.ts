// === Chat Types ===

export type ChatCategory = "personal" | "business" | "group" | "channel" | "spam" | "uncategorized";

export type TriageStatus = "inbox" | "done" | "snoozed" | "need_reply" | "fyi";

export interface ChatInfo {
  id: string;
  name: string;
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTimestamp: number;
  unreadCount: number;
  isGroup: boolean;
  isChannel: boolean;
  /** Phone number or group JID */
  jid?: string;
}

export interface ChatWithTriage extends ChatInfo {
  category: ChatCategory;
  triageStatus: TriageStatus;
  priority: number;
  snoozedUntil?: number;
}

// === Message Types ===

export interface Message {
  id: string;
  chatId: string;
  sender: string;
  senderName?: string;
  content: string;
  timestamp: number;
  isOutgoing: boolean;
  /** Type of message content */
  type: "text" | "image" | "video" | "audio" | "document" | "sticker" | "link" | "unknown";
  /** For media messages, the caption */
  caption?: string;
  /** Extracted URLs from the message */
  links?: string[];
}

// === Triage Types ===

export interface TriageAction {
  chatId: string;
  status: TriageStatus;
  category?: ChatCategory;
  snoozedUntil?: number;
}

// === AI Types ===

export interface ChatSummary {
  chatId: string;
  summary: string;
  actionItems: string[];
  suggestedReplies: string[];
  generatedAt: number;
}

// === API Types ===

export interface SyncStatus {
  connected: boolean;
  lastSyncAt: number | null;
  chatCount: number;
  messageCount: number;
}

// === Search Types ===

export interface SearchQuery {
  query: string;
  chatId?: string;
  category?: ChatCategory;
  dateFrom?: number;
  dateTo?: number;
  type?: Message["type"];
}

export interface SearchResult {
  message: Message;
  chatName: string;
  highlight: string;
}

export interface Bookmark {
  id: string;
  messageId: string;
  chatId: string;
  note?: string;
  createdAt: number;
}
