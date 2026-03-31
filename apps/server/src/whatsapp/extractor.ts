import type { Page } from "playwright";
import type { ChatInfo, Message } from "@superwa/shared";

/**
 * Extract the visible chat list from WhatsApp Web.
 *
 * WhatsApp Web's DOM structure changes frequently. These selectors
 * target the current (as of early 2026) structure but may need updating.
 */
export async function extractChats(page: Page): Promise<ChatInfo[]> {
  // Wait for chat list to be present
  await page.waitForSelector('[aria-label="Chat list"]', { timeout: 10_000 });

  const chats = await page.evaluate(() => {
    const results: Array<{
      id: string;
      name: string;
      lastMessage: string;
      lastMessageTimestamp: number;
      unreadCount: number;
      isGroup: boolean;
      isChannel: boolean;
    }> = [];

    // Get all chat row elements
    const chatRows = document.querySelectorAll('[aria-label="Chat list"] > div [role="listitem"]');

    chatRows.forEach((row, index) => {
      try {
        // Chat name — typically in a span with title attribute
        const nameEl = row.querySelector('[data-testid="cell-frame-title"] span[title]');
        const name = nameEl?.getAttribute("title") ?? `Chat ${index}`;

        // Last message preview
        const lastMsgEl = row.querySelector('[data-testid="cell-frame-secondary"] span[title]');
        const lastMessage = lastMsgEl?.getAttribute("title") ?? "";

        // Unread badge
        const unreadEl = row.querySelector('[data-testid="icon-unread-count"]');
        const unreadText = unreadEl?.textContent ?? "0";
        const unreadCount = parseInt(unreadText, 10) || 0;

        // Timestamp
        const timeEl = row.querySelector('[data-testid="cell-frame-primary-detail"]');
        const timeText = timeEl?.textContent ?? "";

        // Group indicator — groups typically have a group icon or specific attribute
        const groupIcon = row.querySelector('[data-testid="default-group"]');
        const isGroup = groupIcon !== null;

        // Channel indicator
        const channelIcon = row.querySelector('[data-testid="newsletter"]');
        const isChannel = channelIcon !== null;

        results.push({
          id: `chat_${index}_${name.replace(/\s/g, "_").substring(0, 20)}`,
          name,
          lastMessage,
          lastMessageTimestamp: Date.now(), // We'll parse timeText later if needed
          unreadCount,
          isGroup,
          isChannel,
        });
      } catch {
        // Skip malformed rows
      }
    });

    return results;
  });

  console.log(`📋 Extracted ${chats.length} chats`);
  return chats;
}

/**
 * Extract messages from chats that have unread messages.
 * Opens each unread chat and reads visible messages.
 */
export async function extractMessages(
  page: Page,
  chats: ChatInfo[]
): Promise<Message[]> {
  const allMessages: Message[] = [];
  const unreadChats = chats.filter((c) => c.unreadCount > 0);

  for (const chat of unreadChats.slice(0, 10)) {
    // Limit to 10 chats per sync
    try {
      // Click on the chat to open it
      const chatSelector = `[aria-label="Chat list"] [title="${chat.name}"]`;
      await page.click(chatSelector);
      await page.waitForTimeout(500); // Brief wait for messages to load

      const messages = await page.evaluate((chatId: string) => {
        const results: Array<{
          id: string;
          chatId: string;
          sender: string;
          senderName?: string;
          content: string;
          timestamp: number;
          isOutgoing: boolean;
          type: "text" | "image" | "video" | "audio" | "document" | "sticker" | "link" | "unknown";
        }> = [];

        // Message containers
        const msgElements = document.querySelectorAll('[data-testid="msg-container"]');

        msgElements.forEach((msg, index) => {
          try {
            const isOutgoing = msg.classList.contains("message-out");

            // Sender name (for group messages)
            const senderEl = msg.querySelector('[data-testid="msg-meta"] span');
            const senderName = senderEl?.textContent ?? undefined;

            // Message text
            const textEl = msg.querySelector('[data-testid="balloon-text"] span.selectable-text');
            const content = textEl?.textContent ?? "";

            // Determine message type
            let type: "text" | "image" | "video" | "audio" | "document" | "sticker" | "link" | "unknown" = "text";
            if (msg.querySelector('[data-testid="image-thumb"]')) type = "image";
            else if (msg.querySelector('[data-testid="video-thumb"]')) type = "video";
            else if (msg.querySelector('[data-testid="audio-player"]')) type = "audio";
            else if (msg.querySelector('[data-testid="document-thumb"]')) type = "document";

            if (content || type !== "text") {
              results.push({
                id: `msg_${chatId}_${index}`,
                chatId,
                sender: isOutgoing ? "me" : (senderName ?? "them"),
                senderName: isOutgoing ? undefined : senderName,
                content,
                timestamp: Date.now() - (msgElements.length - index) * 60_000, // Approximate
                isOutgoing,
                type,
              });
            }
          } catch {
            // Skip malformed messages
          }
        });

        return results;
      }, chat.id);

      allMessages.push(...messages);
    } catch (err) {
      console.warn(`⚠️ Failed to extract messages from "${chat.name}":`, err);
    }
  }

  console.log(`💬 Extracted ${allMessages.length} messages from ${unreadChats.length} unread chats`);
  return allMessages;
}
