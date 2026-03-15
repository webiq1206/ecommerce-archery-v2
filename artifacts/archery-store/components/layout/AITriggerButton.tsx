"use client";

import { Bot } from "lucide-react";
import { useUIStore } from "@/store/ui-store";

export function AITriggerButton() {
  const setOpen = useUIStore((s) => s.setAIDrawerOpen);
  const isOpen = useUIStore((s) => s.isAIDrawerOpen);

  if (isOpen) return null;

  return (
    <button
      onClick={() => setOpen(true)}
      aria-label="Open AI shopping assistant"
      className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 z-[70] bg-primary hover:bg-primary/90 text-primary-foreground w-14 h-14 rounded-full shadow-2xl shadow-primary/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95 group"
    >
      <Bot className="w-6 h-6 transition-transform group-hover:rotate-12" />
      <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-background animate-pulse" />
    </button>
  );
}
