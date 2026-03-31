import type { MessageRow } from "../lib/api";

interface MessageBubbleProps {
  message: MessageRow;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutgoing = message.is_outgoing;

  return (
    <div className={`flex ${isOutgoing ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 ${
          isOutgoing
            ? "bg-accent/20 text-foreground rounded-br-md"
            : "bg-surface border border-border rounded-bl-md"
        }`}
      >
        {!isOutgoing && message.sender_name && (
          <p className="text-xs font-semibold text-accent-dark mb-1">
            {message.sender_name}
          </p>
        )}
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p className="text-[10px] text-muted mt-1 text-right">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
