"use client";

import { useUIStore } from "@/store/ui-store";
import { Sparkles } from "lucide-react";

interface OpenAIButtonProps {
  label?: string;
  className?: string;
  variant?: "cta" | "inline";
}

export function OpenAIButton({
  label = "Ask our AI Advisor",
  className,
  variant = "cta",
}: OpenAIButtonProps) {
  const openAI = useUIStore((s) => s.setAIDrawerOpen);

  if (variant === "inline") {
    return (
      <button
        onClick={() => openAI(true)}
        className={
          className ??
          "inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 transition-colors font-medium"
        }
      >
        <Sparkles className="w-3.5 h-3.5" />
        {label}
      </button>
    );
  }

  return (
    <button
      onClick={() => openAI(true)}
      className={
        className ??
        "inline-flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-6 py-3 rounded-lg font-semibold text-sm transition-all hover:-translate-y-0.5 uppercase tracking-wider"
      }
    >
      <Sparkles className="w-4 h-4" />
      {label}
    </button>
  );
}
