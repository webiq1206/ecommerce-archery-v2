"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSearch} className="flex gap-3">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search bows, arrows, accessories..."
        className="flex-1 px-6 py-4 rounded-xl border border-border bg-background text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button type="submit" className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold flex items-center gap-2">
        <Search className="w-5 h-5" /> Search
      </button>
    </form>
  );
}
