import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema.js";
import { join } from "path";

export type AppDatabase = BetterSQLite3Database<typeof schema>;

let db: AppDatabase | null = null;

export function initDb(dbPath?: string): AppDatabase {
  if (db) return db;

  const path = dbPath ?? join(process.cwd(), "superwa.db");
  const sqlite = new Database(path);

  // Enable WAL mode for better concurrent read performance
  sqlite.pragma("journal_mode = WAL");

  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS chats (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar_url TEXT,
      last_message TEXT NOT NULL DEFAULT '',
      last_message_timestamp INTEGER NOT NULL DEFAULT 0,
      unread_count INTEGER NOT NULL DEFAULT 0,
      is_group INTEGER NOT NULL DEFAULT 0,
      is_channel INTEGER NOT NULL DEFAULT 0,
      jid TEXT,
      category TEXT NOT NULL DEFAULT 'uncategorized',
      triage_status TEXT NOT NULL DEFAULT 'inbox',
      priority INTEGER NOT NULL DEFAULT 0,
      snoozed_until INTEGER
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL REFERENCES chats(id),
      sender TEXT NOT NULL,
      sender_name TEXT,
      content TEXT NOT NULL DEFAULT '',
      timestamp INTEGER NOT NULL,
      is_outgoing INTEGER NOT NULL DEFAULT 0,
      type TEXT NOT NULL DEFAULT 'text',
      caption TEXT,
      links TEXT
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL REFERENCES messages(id),
      chat_id TEXT NOT NULL REFERENCES chats(id),
      note TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS summaries (
      id TEXT PRIMARY KEY,
      chat_id TEXT NOT NULL REFERENCES chats(id),
      summary TEXT NOT NULL,
      action_items TEXT NOT NULL DEFAULT '[]',
      suggested_replies TEXT NOT NULL DEFAULT '[]',
      generated_at INTEGER NOT NULL
    );

    -- Full-text search index on messages
    CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
      content,
      sender_name,
      content='messages',
      content_rowid='rowid'
    );

    -- Triggers to keep FTS in sync
    CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
      INSERT INTO messages_fts(rowid, content, sender_name) VALUES (new.rowid, new.content, new.sender_name);
    END;

    CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
      INSERT INTO messages_fts(messages_fts, rowid, content, sender_name) VALUES('delete', old.rowid, old.content, old.sender_name);
    END;

    CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
      INSERT INTO messages_fts(messages_fts, rowid, content, sender_name) VALUES('delete', old.rowid, old.content, old.sender_name);
      INSERT INTO messages_fts(rowid, content, sender_name) VALUES (new.rowid, new.content, new.sender_name);
    END;
  `);

  db = drizzle(sqlite, { schema });
  console.log(`💾 Database initialized at ${path}`);
  return db;
}

export function getDb(): AppDatabase {
  if (!db) throw new Error("Database not initialized. Call initDb() first.");
  return db;
}

export { schema };
