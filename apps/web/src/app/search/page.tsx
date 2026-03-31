"use client";

import { useState } from "react";
import { search as searchApi, type MessageRow } from "../../lib/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MessageRow[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await searchApi.query(query);
      setResults(data);
      setSearched(true);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Search</h2>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-accent text-white font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
          >
            {loading ? "..." : "Search"}
          </button>
        </div>
      </form>

      {searched && results.length === 0 && (
        <p className="text-center text-muted py-8">No results found for &quot;{query}&quot;</p>
      )}

      <div className="space-y-3">
        {results.map((msg) => (
          <div key={msg.id} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-accent-dark">
                {msg.sender_name ?? msg.sender}
              </span>
              <span className="text-xs text-muted">
                {new Date(msg.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="text-sm">{msg.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
