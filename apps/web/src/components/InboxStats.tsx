import type { Stats } from "../lib/api";

interface InboxStatsProps {
  stats: Stats;
}

export function InboxStats({ stats }: InboxStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <StatCard label="Inbox" value={stats.inboxCount} color="text-accent" />
      <StatCard label="Unread" value={stats.totalUnread} color="text-red-500" />
      <StatCard label="Total Chats" value={stats.totalChats} color="text-muted" />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
