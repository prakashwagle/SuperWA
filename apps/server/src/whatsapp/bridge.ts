import { chromium, type Browser, type Page } from "playwright";
import type { ExtractedData } from "./types.js";
import { extractChats, extractMessages } from "./extractor.js";

export class WhatsAppBridge {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private syncInterval: ReturnType<typeof setInterval> | null = null;

  /** Callback fired after each sync cycle */
  onSync: ((data: ExtractedData) => void) | null = null;

  async launch(): Promise<void> {
    if (this.browser) return;

    this.browser = await chromium.launch({
      headless: false, // Need visible browser for QR scan
      args: ["--disable-blink-features=AutomationControlled"],
    });

    const context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
    });

    this.page = await context.newPage();
    await this.page.goto("https://web.whatsapp.com", {
      waitUntil: "domcontentloaded",
    });

    console.log("🌐 WhatsApp Web opened — waiting for QR scan or session restore...");
  }

  async waitForAuth(timeoutMs = 120_000): Promise<boolean> {
    if (!this.page) throw new Error("Bridge not launched");

    try {
      // Wait for either the chat list (already authenticated) or the QR code
      await this.page.waitForSelector(
        '[aria-label="Chat list"], [data-ref]',
        { timeout: timeoutMs }
      );

      // Now wait specifically for the chat list to confirm we're fully loaded
      await this.page.waitForSelector('[aria-label="Chat list"]', {
        timeout: timeoutMs,
      });

      console.log("✅ WhatsApp Web authenticated");
      return true;
    } catch {
      console.log("❌ Authentication timed out");
      return false;
    }
  }

  async sync(): Promise<ExtractedData> {
    if (!this.page) throw new Error("Bridge not launched or not authenticated");

    const chats = await extractChats(this.page);
    const messages = await extractMessages(this.page, chats);

    const data: ExtractedData = {
      chats,
      messages,
      extractedAt: Date.now(),
    };

    this.onSync?.(data);
    return data;
  }

  startPeriodicSync(intervalMs = 30_000): void {
    if (this.syncInterval) return;

    this.syncInterval = setInterval(async () => {
      try {
        await this.sync();
      } catch (err) {
        console.error("Sync error:", err);
      }
    }, intervalMs);

    console.log(`🔄 Periodic sync started (every ${intervalMs / 1000}s)`);
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async getQrDataUrl(): Promise<string | null> {
    if (!this.page) return null;

    try {
      const canvas = await this.page.$("canvas");
      if (!canvas) return null;

      const dataUrl = await canvas.evaluate((el) => {
        const c = el as HTMLCanvasElement;
        return c.toDataURL("image/png");
      });

      return dataUrl;
    } catch {
      return null;
    }
  }

  isConnected(): boolean {
    return this.page !== null;
  }

  async close(): Promise<void> {
    this.stopPeriodicSync();
    await this.browser?.close();
    this.browser = null;
    this.page = null;
  }
}
