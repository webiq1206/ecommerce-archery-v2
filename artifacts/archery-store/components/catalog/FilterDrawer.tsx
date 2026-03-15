"use client";

import { useState } from "react";
import { X, SlidersHorizontal } from "lucide-react";
import { FilterPanel } from "./FilterPanel";

interface FilterDrawerProps {
  brands: { id: string; name: string; slug: string }[];
  subcategories: { id: string; name: string; slug: string }[];
  categorySlug: string;
  totalProducts: number;
  activeFilterCount: number;
  basePath?: string;
}

export function FilterDrawer({ brands, subcategories, categorySlug, totalProducts, activeFilterCount, basePath }: FilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white/70 hover:text-white transition-colors"
      >
        <SlidersHorizontal className="w-4 h-4" />
        Filter & Sort
        {activeFilterCount > 0 && (
          <span className="bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[80] lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <div
        className={`fixed inset-x-0 bottom-0 top-[10vh] bg-background z-[90] transition-transform duration-300 ease-in-out lg:hidden rounded-t-2xl overflow-y-auto ${
          isOpen ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5 sticky top-0 bg-background z-10">
          <h3 className="font-display text-lg tracking-wider uppercase text-white">Filters</h3>
          <button onClick={() => setIsOpen(false)} className="p-2 text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          <FilterPanel
            brands={brands}
            subcategories={subcategories}
            categorySlug={categorySlug}
            totalProducts={totalProducts}
            basePath={basePath}
          />
        </div>
        <div className="sticky bottom-0 p-5 bg-background border-t border-white/5">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold uppercase tracking-wider text-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
