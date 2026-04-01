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

  // Debug endpoint — inspect a single chat row's inner structure
  router.get("/whatsapp/debug-row", async (_req, res) => {
    const page = bridge.getPage();
    if (!page) return res.status(400).json({ error: "Bridge not launched" });

    try {
      const rowInfo = await page.evaluate(() => {
        const grid = document.querySelector('[aria-label="Chat list"][role="grid"]');
        if (!grid) return { error: "No chat list grid found" };

        const rows = grid.querySelectorAll('[role="row"]');
        if (rows.length === 0) return { error: "No rows found", gridChildCount: grid.children.length };

        // Get detailed info from first 3 rows
        const rowDetails = Array.from(rows).slice(0, 3).map((row, i) => {
          // Get all span elements with title attribute
          const titledSpans = Array.from(row.querySelectorAll("span[title]")).map(s => ({
            title: s.getAttribute("title"),
            textContent: s.textContent?.substring(0, 100),
            parentClass: s.parentElement?.className?.substring(0, 50),
          }));

          // Get the gridcell
          const gridcell = row.querySelector('[role="gridcell"]');

          // All text nodes via innerText
          const innerText = row.textContent?.substring(0, 200);

          // Unread badge — look for spans with just a number
          const allSpans = Array.from(row.querySelectorAll("span"));
          const badgeSpans = allSpans.filter(s => {
            const t = s.textContent?.trim() ?? "";
            return /^\d+$/.test(t) && t.length <= 4;
          }).map(s => ({
            text: s.textContent,
            className: s.className?.substring(0, 80),
            ariaHidden: s.getAttribute("aria-hidden"),
          }));

          // Group icon — look for data-icon attribute
          const dataIcons = Array.from(row.querySelectorAll("[data-icon]")).map(el => ({
            dataIcon: el.getAttribute("data-icon"),
            tag: el.tagName,
          }));

          return {
            index: i,
            outerHTML: row.innerHTML.substring(0, 1500),
            titledSpans,
            badgeSpans,
            dataIcons,
            innerText,
            hasGridcell: !!gridcell,
          };
        });

        return { totalRows: rows.length, rowDetails };
      });

      res.json(rowInfo);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Debug endpoint — inspect WhatsApp Web DOM to fix selectors
  router.get("/whatsapp/debug", async (_req, res) => {
    const page = bridge.getPage();
    if (!page) return res.status(400).json({ error: "Bridge not launched" });

    try {
      // Take screenshot
      const screenshot = await page.screenshot({ fullPage: false });
      const screenshotB64 = screenshot.toString("base64");

      // Dump DOM structure around the chat list area
      const domInfo = await page.evaluate(() => {
        const info: Record<string, unknown> = {};

        // Find all elements with aria-label
        const ariaLabels = Array.from(document.querySelectorAll("[aria-label]"))
          .slice(0, 50)
          .map((el) => ({
            tag: el.tagName,
            ariaLabel: el.getAttribute("aria-label"),
            role: el.getAttribute("role"),
            childCount: el.children.length,
          }));
        info.ariaLabels = ariaLabels;

        // Find all elements with role="listitem" or role="row" or role="list"
        const roleElements = Array.from(
          document.querySelectorAll('[role="listitem"], [role="row"], [role="list"], [role="grid"], [role="listbox"]')
        )
          .slice(0, 30)
          .map((el) => ({
            tag: el.tagName,
            role: el.getAttribute("role"),
            ariaLabel: el.getAttribute("aria-label"),
            className: el.className.substring(0, 100),
            childCount: el.children.length,
            textPreview: el.textContent?.substring(0, 80),
          }));
        info.roleElements = roleElements;

        // Find all data-testid attributes
        const testIds = Array.from(document.querySelectorAll("[data-testid]"))
          .slice(0, 80)
          .map((el) => ({
            testId: el.getAttribute("data-testid"),
            tag: el.tagName,
            ariaLabel: el.getAttribute("aria-label"),
          }));
        info.testIds = testIds;

        // Look for the pane/side panel that contains the chat list
        const paneSide = document.querySelector('#pane-side');
        if (paneSide) {
          info.paneSide = {
            found: true,
            childCount: paneSide.children.length,
            firstChildTag: paneSide.children[0]?.tagName,
            firstChildRole: paneSide.children[0]?.getAttribute("role"),
            html: paneSide.innerHTML.substring(0, 2000),
          };
        } else {
          info.paneSide = { found: false };
        }

        // Check for any div with "chat" in aria-label (case-insensitive)
        const chatRelated = Array.from(document.querySelectorAll("*"))
          .filter((el) => {
            const label = el.getAttribute("aria-label")?.toLowerCase() ?? "";
            return label.includes("chat");
          })
          .slice(0, 20)
          .map((el) => ({
            tag: el.tagName,
            ariaLabel: el.getAttribute("aria-label"),
            role: el.getAttribute("role"),
            childCount: el.children.length,
          }));
        info.chatRelated = chatRelated;

        return info;
      });

      res.json({ domInfo, screenshot: `data:image/png;base64,${screenshotB64}` });
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
