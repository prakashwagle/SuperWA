const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

// --- WhatsApp ---
export const whatsapp = {
  launch: () => fetchApi<{ status: string }>("/api/whatsapp/launch", { method: "POST" }),
  getQr: () => fetchApi<{ qr: string | null }>("/api/whatsapp/qr"),
  auth: () => fetchApi<{ status: string; chatCount: number }>("/api/whatsapp/auth", { method: "POST" }),
  status: () => fetchApi<{ connected: boolean }>("/api/whatsapp/status"),
  sync: () => fetchApi<{ chatCount: number; messageCount: number }>("/api/whatsapp/sync", { method: "POST" }),
};

// --- Chats ---
export interface ChatRow {
  id: string;
  name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_timestamp: number;
  unread_count: number;
  is_group: boolean;
  is_channel: boolean;
  category: string;
  triage_status: string;
  priority: number;
  snoozed_until: number | null;
}

export interface MessageRow {
  id: string;
  chat_id: string;
  sender: string;
  sender_name: string | null;
  content: string;
  timestamp: number;
  is_outgoing: boolean;
  type: string;
}

export const chats = {
  list: (params?: { category?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.category) qs.set("category", params.category);
    if (params?.status) qs.set("status", params.status);
    const query = qs.toString();
    return fetchApi<ChatRow[]>(`/api/chats${query ? `?${query}` : ""}`);
  },
  get: (id: string) => fetchApi<ChatRow>(`/api/chats/${encodeURIComponent(id)}`),
  messages: (id: string, limit = 50) =>
    fetchApi<MessageRow[]>(`/api/chats/${encodeURIComponent(id)}/messages?limit=${limit}`),
  triage: (id: string, body: { status: string; category?: string; snoozedUntil?: number }) =>
    fetchApi<{ success: boolean }>(`/api/chats/${encodeURIComponent(id)}/triage`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// --- Stats ---
export interface Stats {
  totalChats: number;
  inboxCount: number;
  totalUnread: number;
  categoryBreakdown: Record<string, number>;
}

export const stats = {
  get: () => fetchApi<Stats>("/api/stats"),
};

// --- Search ---
export const search = {
  query: (q: string) => fetchApi<MessageRow[]>(`/api/search?q=${encodeURIComponent(q)}`),
};
