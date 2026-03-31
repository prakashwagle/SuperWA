import type { ChatInfo, ChatCategory, Message } from "@superwa/shared";

/**
 * Simple rule-based categorizer for the prototype.
 * Phase 2 will use Claude API for intelligent categorization.
 */
export function categorizeChat(
  chat: ChatInfo,
  messages: Message[]
): ChatCategory {
  if (chat.isChannel) return "channel";
  if (chat.isGroup) return "group";

  // Simple heuristics — to be replaced with AI
  const name = chat.name.toLowerCase();
  const lastMsg = chat.lastMessage.toLowerCase();

  // Business indicators
  const businessKeywords = [
    "order", "payment", "invoice", "delivery", "otp", "bank",
    "customer", "service", "support", "booking", "appointment",
  ];
  if (businessKeywords.some((kw) => name.includes(kw) || lastMsg.includes(kw))) {
    return "business";
  }

  // Spam indicators
  const spamKeywords = [
    "offer", "discount", "cashback", "free", "winner", "congratulations",
    "click here", "limited time", "act now",
  ];
  if (spamKeywords.some((kw) => lastMsg.includes(kw))) {
    return "spam";
  }

  return "personal";
}

/**
 * Calculate priority score for a chat.
 * Higher = more important.
 */
export function calculatePriority(chat: ChatInfo): number {
  let score = 0;

  // Unread messages boost priority
  score += Math.min(chat.unreadCount * 10, 50);

  // Recency boost (messages in last hour get highest boost)
  const ageMs = Date.now() - chat.lastMessageTimestamp;
  if (ageMs < 3600_000) score += 30;
  else if (ageMs < 86400_000) score += 15;

  // Individual chats get slight boost over groups
  if (!chat.isGroup && !chat.isChannel) score += 5;

  // Channels get deprioritized
  if (chat.isChannel) score -= 20;

  return score;
}
