import type { ChatInfo, Message } from "@superwa/shared";

export interface WhatsAppSession {
  connected: boolean;
  qrDataUrl: string | null;
}

export interface ExtractedData {
  chats: ChatInfo[];
  messages: Message[];
  extractedAt: number;
}

export interface BridgeEvents {
  onSync: ((data: ExtractedData) => void) | null;
}
