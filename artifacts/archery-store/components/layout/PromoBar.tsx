"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

const messages = [
  "Free Shipping on Orders Over $99",
  "30-Day Returns on All Products",
  "Expert Support — Call or Chat Anytime",
];

export function PromoBar() {
  const [dismissed, setDismissed] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("apex-promo-dismissed");
    if (stored !== "true") setDismissed(false);
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div className="bg-primary text-primary-foreground text-xs font-medium tracking-wider uppercase text-center py-2 px-4 relative z-[60]">
      <span className="transition-opacity duration-300">{messages[index]}</span>
      <button
        onClick={() => {
          setDismissed(true);
          localStorage.setItem("apex-promo-dismissed", "true");
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:opacity-70 transition-opacity"
        aria-label="Dismiss promotion bar"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
