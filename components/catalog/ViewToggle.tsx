"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";

export function ViewToggle({ currentView }: { currentView: "grid" | "list" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setView = (view: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (view === "grid") {
      params.delete("view");
    } else {
      params.set("view", view);
    }
    router.push(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="flex items-center gap-1 border border-white/10 rounded-lg p-0.5">
      <button
        onClick={() => setView("grid")}
        className={`p-1.5 rounded transition-colors ${currentView === "grid" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
        aria-label="Grid view"
      >
        <LayoutGrid className="w-4 h-4" />
      </button>
      <button
        onClick={() => setView("list")}
        className={`p-1.5 rounded transition-colors ${currentView === "list" ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}
        aria-label="List view"
      >
        <List className="w-4 h-4" />
      </button>
    </div>
  );
}
