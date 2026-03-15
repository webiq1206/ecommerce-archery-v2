"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";

interface StickyATCProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
  };
  variant?: string;
  variantId?: string;
  available: boolean;
  observeSelector: string;
}

export function StickyATC({ product, variant, variantId, available, observeSelector }: StickyATCProps) {
  const [visible, setVisible] = useState(false);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    const target = document.querySelector(observeSelector);
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [observeSelector]);

  const handleAdd = () => {
    if (!available) return;
    addItem({
      productId: product.id,
      variantId,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      variant,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-[#0D0D0D]/98 backdrop-blur-md border-t border-white/5 z-40 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-sm font-medium text-white truncate">{product.name}</span>
          {variant && <span className="text-xs text-white/40 shrink-0">{variant}</span>}
          <span className="text-sm font-medium text-white shrink-0">{formatPrice(product.price)}</span>
        </div>
        <button
          onClick={handleAdd}
          disabled={!available}
          className={`px-6 py-2.5 rounded-lg font-semibold uppercase tracking-wider text-xs shrink-0 transition-all ${
            available
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-white/10 text-white/30 cursor-not-allowed"
          }`}
        >
          {!available ? "Out of Stock" : added ? "Added!" : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
