"use client";

import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";

interface BundleProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  image: string;
}

export function BundleBuilder({ products }: { products: BundleProduct[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(products.map((p) => p.id)));
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  if (products.length === 0) return null;

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bundleTotal = products
    .filter((p) => selected.has(p.id))
    .reduce((sum, p) => sum + parseFloat(p.price), 0);

  const handleAddBundle = () => {
    products
      .filter((p) => selected.has(p.id))
      .forEach((p) => {
        addItem({
          productId: p.id,
          name: p.name,
          slug: p.slug,
          price: parseFloat(p.price),
          image: p.image,
        });
      });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <section className="py-16 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl md:text-3xl font-normal text-white mb-10">
          Complete Your Setup
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {products.map((p) => (
            <label
              key={p.id}
              className={`relative bg-card rounded-xl overflow-hidden cursor-pointer group border-2 transition-colors ${
                selected.has(p.id) ? "border-primary" : "border-transparent"
              }`}
            >
              <input
                type="checkbox"
                checked={selected.has(p.id)}
                onChange={() => toggle(p.id)}
                className="absolute top-3 right-3 z-10 rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
              />
              <div className="aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <h4 className="text-sm font-medium text-white truncate normal-case">{p.name}</h4>
                <span className="text-sm text-white/70">{formatPrice(p.price)}</span>
              </div>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm text-white/50">Bundle Total: </span>
            <span className="text-lg font-medium text-white">{formatPrice(bundleTotal)}</span>
          </div>
          <button
            onClick={handleAddBundle}
            disabled={selected.size === 0}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold uppercase tracking-wider text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {added ? "Added!" : `Add ${selected.size} Items to Cart`}
          </button>
        </div>
      </div>
    </section>
  );
}
