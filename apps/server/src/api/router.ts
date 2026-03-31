import { Router } from "express";
import { eq, desc, like, and, sql } from "drizzle-orm";
import type { AppDatabase } from "../db/index.js";
import { schema } from "../db/index.js";
import { WhatsAppBridge } from "../whatsapp/bridge.js";
import type { TriageAction, ChatCategory, TriageStatus } from "@superwa/shared";

export function createApiRouter(db: AppDatabase, bridge: WhatsAppBridge): Router {
  const router = Router();

  // --- WhatsApp Connection ---

  router.post("/whatsapp/launch", async (_req, res) => {
    try {
      await bridge.launch();
      res.json({ status: "launched" });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  router.get("/whatsapp/qr", async (_req, res) => {
    const qr = await bridge.getQrDataUrl();
    res.json({ qr });
  });

  router.post("/whatsapp/auth", async (_req, res) => {
    const success = await bridge.waitForAuth();
    if (success) {
      // Do initial sync
      const data = await bridge.sync();
      // Upsert chats
      for (const chat of data.chats) {
        await db
          .insert(schema.chats)
          .values({
            id: chat.id,
            name: chat.name,
            lastMessage: chat.lastMessage,
            lastMessageTimestamp: chat.lastMessageTimestamp,
            unreadCount: chat.unreadCount,
            isGroup: chat.isGroup,
            isChannel: chat.isChannel,
          })
          .onConflictDoUpdate({
            target: schema.chats.id,
            set: {
              name: chat.name,
              lastMessage: chat.lastMessage,
              lastMessageTimestamp: chat.lastMessageTimestamp,
              unreadCount: chat.unreadCount,
            },
          });
      }
      // Insert messages
      for (const msg of data.messages) {
        await db
          .insert(schema.messages)
          .values({
            id: msg.id,
            chatId: msg.chatId,
            sender: msg.sender,
            senderName: msg.senderName,
            content: msg.content,
            timestamp: msg.timestamp,
            isOutgoing: msg.isOutgoing,
            type: msg.type,
          })
          .onConflictDoNothing();
      }
      bridge.startPeriodicSync();
      res.json({ status: "authenticated", chatCount: data.chats.length });
    } else {
      res.status(408).json({ error: "Authentication timed out" });
    }
  });

  router.get("/whatsapp/status", (_req, res) => {
    res.json({ connected: bridge.isConnected() });
  });

  router.post("/whatsapp/sync", async (_req, res) => {
    try {
      const data = await bridge.sync();
      res.json({ chatCount: data.chats.length, messageCount: data.messages.length });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // --- Chats ---

  router.get("/chats", async (req, res) => {
    const category = req.query.category as ChatCategory | undefined;
    const status = req.query.status as TriageStatus | undefined;

    let conditions = [];
    if (category) conditions.push(eq(schema.chats.category, category));
    if (status) conditions.push(eq(schema.chats.triageStatus, status));

    const chats =
      conditions.length > 0
        ? await db.select().from(schema.chats).where(and(...conditions)).orderBy(desc(schema.chats.lastMessageTimestamp))
        : await db.select().from(schema.chats).orderBy(desc(schema.chats.lastMessageTimestamp));

    res.json(chats);
  });

  router.get("/chats/:id", async (req, res) => {
    const result = await db.select().from(schema.chats).where(eq(schema.chats.id, req.params.id));
    if (result.length === 0) return res.status(404).json({ error: "Chat not found" });
    res.json(result[0]);
  });

  router.get("/chats/:id/messages", async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const msgs = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.chatId, req.params.id))
      .orderBy(desc(schema.messages.timestamp))
      .limit(limit);
    res.json(msgs);
  });

  // --- Triage ---

  router.post("/chats/:id/triage", async (req, res) => {
    const action = req.body as TriageAction;
    const updateData: Record<string, unknown> = {
      triageStatus: action.status,
    };
    if (action.category) updateData.category = action.category;
    if (action.snoozedUntil) updateData.snoozedUntil = action.snoozedUntil;

    await db
      .update(schema.chats)
      .set(updateData)
      .where(eq(schema.chats.id, req.params.id));

    res.json({ success: true });
  });

  // --- Search ---

  router.get("/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) return res.status(400).json({ error: "Query required" });

    // Use FTS5 for full-text search via raw SQL
    const results = db.run(sql`
      SELECT m.*, c.name as chat_name
      FROM messages_fts fts
      JOIN messages m ON m.rowid = fts.rowid
      JOIN chats c ON c.id = m.chat_id
      WHERE messages_fts MATCH ${query}
      ORDER BY m.timestamp DESC
      LIMIT 50
    `);

    res.json(results);
  });

  // --- Stats ---

  router.get("/stats", async (_req, res) => {
    const totalChats = await db.select().from(schema.chats);
    const inboxChats = totalChats.filter((c) => c.triageStatus === "inbox");
    const totalUnread = totalChats.reduce((sum, c) => sum + c.unreadCount, 0);

    const categoryBreakdown: Record<string, number> = {};
    for (const chat of totalChats) {
      categoryBreakdown[chat.category] = (categoryBreakdown[chat.category] ?? 0) + 1;
    }

    res.json({
      totalChats: totalChats.length,
      inboxCount: inboxChats.length,
      totalUnread,
      categoryBreakdown,
    });
  });

  return router;
}
