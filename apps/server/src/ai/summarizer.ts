import type { Message, ChatSummary } from "@superwa/shared";

/**
 * Summarize messages using Claude API.
 * Requires ANTHROPIC_API_KEY environment variable.
 */
export async function summarizeChat(
  chatId: string,
  chatName: string,
  messages: Message[]
): Promise<ChatSummary> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Fallback: simple extractive summary
    return fallbackSummary(chatId, messages);
  }

  const messageText = messages
    .map((m) => `[${m.senderName ?? m.sender}]: ${m.content}`)
    .join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Summarize this WhatsApp conversation from "${chatName}".
Provide:
1. A brief summary (2-3 sentences)
2. Action items (if any)
3. 2-3 suggested quick replies

Conversation:
${messageText}

Respond in JSON format:
{
  "summary": "...",
  "actionItems": ["..."],
  "suggestedReplies": ["..."]
}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("Claude API error:", response.status);
    return fallbackSummary(chatId, messages);
  }

  const result = await response.json();
  const text = result.content?.[0]?.text ?? "{}";

  try {
    const parsed = JSON.parse(text);
    return {
      chatId,
      summary: parsed.summary ?? "No summary available",
      actionItems: parsed.actionItems ?? [],
      suggestedReplies: parsed.suggestedReplies ?? [],
      generatedAt: Date.now(),
    };
  } catch {
    return fallbackSummary(chatId, messages);
  }
}

function fallbackSummary(chatId: string, messages: Message[]): ChatSummary {
  const uniqueSenders = [...new Set(messages.map((m) => m.senderName ?? m.sender))];
  const msgCount = messages.length;
  const lastMsg = messages[messages.length - 1];

  return {
    chatId,
    summary: `${msgCount} messages from ${uniqueSenders.length} participant(s). Last message: "${lastMsg?.content.substring(0, 100) ?? "N/A"}"`,
    actionItems: [],
    suggestedReplies: [],
    generatedAt: Date.now(),
  };
}
