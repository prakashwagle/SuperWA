import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const chats = sqliteTable("chats", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  lastMessage: text("last_message").notNull().default(""),
  lastMessageTimestamp: integer("last_message_timestamp").notNull().default(0),
  unreadCount: integer("unread_count").notNull().default(0),
  isGroup: integer("is_group", { mode: "boolean" }).notNull().default(false),
  isChannel: integer("is_channel", { mode: "boolean" }).notNull().default(false),
  jid: text("jid"),
  // Triage fields
  category: text("category").notNull().default("uncategorized"),
  triageStatus: text("triage_status").notNull().default("inbox"),
  priority: integer("priority").notNull().default(0),
  snoozedUntil: integer("snoozed_until"),
});

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  chatId: text("chat_id").notNull().references(() => chats.id),
  sender: text("sender").notNull(),
  senderName: text("sender_name"),
  content: text("content").notNull().default(""),
  timestamp: integer("timestamp").notNull(),
  isOutgoing: integer("is_outgoing", { mode: "boolean" }).notNull().default(false),
  type: text("type").notNull().default("text"),
  caption: text("caption"),
  links: text("links"), // JSON array stored as text
});

export const bookmarks = sqliteTable("bookmarks", {
  id: text("id").primaryKey(),
  messageId: text("message_id").notNull().references(() => messages.id),
  chatId: text("chat_id").notNull().references(() => chats.id),
  note: text("note"),
  createdAt: integer("created_at").notNull(),
});

export const summaries = sqliteTable("summaries", {
  id: text("id").primaryKey(),
  chatId: text("chat_id").notNull().references(() => chats.id),
  summary: text("summary").notNull(),
  actionItems: text("action_items").notNull().default("[]"), // JSON array
  suggestedReplies: text("suggested_replies").notNull().default("[]"), // JSON array
  generatedAt: integer("generated_at").notNull(),
});
