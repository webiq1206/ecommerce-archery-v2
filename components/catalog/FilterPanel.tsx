"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import * as Slider from "@radix-ui/react-slider";
import { analytics } from "@/lib/analytics/track";

interface FilterPanelProps {
  brands: { id: string; name: string; slug: string }[];
  subcategories: { id: string; name: string; slug: string }[];
  categorySlug: string;
  totalProducts: number;
  basePath?: string;
}

function PriceRangeSlider({ minPrice, maxPrice, onCommit }: { minPrice: string; maxPrice: string; onCommit: (min: string, max: string) => void }) {
  const [range, setRange] = useState<[number, number]>([
    minPrice ? parseInt(minPrice) : 0,
    maxPrice ? parseInt(maxPrice) : 2000,
  ]);

  return (
    <div>
      <label className="text-xs font-bold tracking-wider uppercase text-white/60 mb-3 block">
        Price Range
      </label>
      <Slider.Root
        className="relative flex items-center select-none touch-none w-full h-5"
        value={range}
        onValueChange={(v) => setRange(v as [number, number])}
        onValueCommit={(v) => onCommit(v[0] > 0 ? String(v[0]) : "", v[1] < 2000 ? String(v[1]) : "")}
        min={0}
        max={2000}
        step={10}
        minStepsBetweenThumbs={1}
      >
        <Slider.Track className="bg-white/10 relative grow rounded-full h-[3px]">
          <Slider.Range className="absolute bg-primary rounded-full h-full" />
        </Slider.Track>
        <Slider.Thumb className="block w-4 h-4 bg-primary rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50" />
        <Slider.Thumb className="block w-4 h-4 bg-primary rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50" />
      </Slider.Root>
      <div className="flex justify-between mt-2 text-xs text-white/40">
        <span>${range[0]}</span>
        <span>${range[1]}{range[1] >= 2000 ? "+" : ""}</span>
      </div>
    </div>
  );
}

export function FilterPanel({ brands, subcategories, categorySlug, totalProducts, basePath }: FilterPanelProps) {
  const clearPath = basePath ?? `/categories/${categorySlug}`;
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") ?? "newest";
  const currentBrands = searchParams.getAll("brand");
  const currentMinPrice = searchParams.get("minPrice") ?? "";
  const currentMaxPrice = searchParams.get("maxPrice") ?? "";
  const inStock = searchParams.get("inStock") === "true";
  const hand = searchParams.get("hand") ?? "";

  const updateParams = useCallback(
    (updates: Record<string, string | string[] | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        params.delete(key);
        if (value === null) return;
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else if (value) {
          params.set(key, value);
        }
      });
      params.delete("page");

      const filterKey = Object.keys(updates)[0];
      const filterValue = Object.values(updates)[0];
      if (filterKey && filterValue !== null) {
        analytics.filterApplied({
          type: filterKey,
          value: Array.isArray(filterValue) ? filterValue.join(",") : String(filterValue),
        });
      }

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const drawWeightMin = searchParams.get("drawWeightMin") ?? "";
  const drawWeightMax = searchParams.get("drawWeightMax") ?? "";
  const hasActiveFilters = currentBrands.length > 0 || currentMinPrice || currentMaxPrice || inStock || hand || drawWeightMin || drawWeightMax;

  return (
    <aside className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm tracking-wider uppercase text-white">
          Filters
        </h3>
        <span className="text-xs text-white/40">{totalProducts} products</span>
      </div>

      {hasActiveFilters && (
        <button
          onClick={() => router.push(clearPath)}
          className="text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Clear All Filters
        </button>
      )}

      {/* Sort */}
      <div>
        <label className="text-xs font-bold tracking-wider uppercase text-white/60 mb-3 block">
          Sort By
        </label>
        <select
          value={currentSort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-primary"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="best-sellers">Best Sellers</option>
          <option value="top-rated">Top Rated</option>
        </select>
      </div>

      {/* Price Range Slider */}
      <PriceRangeSlider
        minPrice={currentMinPrice}
        maxPrice={currentMaxPrice}
        onCommit={(min, max) => updateParams({ minPrice: min || null, maxPrice: max || null })}
      />

      {/* Brands */}
      {brands.length > 0 && (
        <div>
          <label className="text-xs font-bold tracking-wider uppercase text-white/60 mb-3 block">
            Brand
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {brands.map((brand) => (
              <label key={brand.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={currentBrands.includes(brand.slug)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...currentBrands, brand.slug]
                      : currentBrands.filter((b) => b !== brand.slug);
                    updateParams({ brand: next.length > 0 ? next : null });
                  }}
                  className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                />
                <span className="text-sm text-white/60 group-hover:text-white transition-colors">
                  {brand.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div>
          <label className="text-xs font-bold tracking-wider uppercase text-white/60 mb-3 block">
            Subcategories
          </label>
          <div className="space-y-2">
            {subcategories.map((sub) => (
              <label key={sub.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={searchParams.getAll("sub").includes(sub.slug)}
                  onChange={(e) => {
                    const current = searchParams.getAll("sub");
                    const next = e.target.checked
                      ? [...current, sub.slug]
                      : current.filter((s) => s !== sub.slug);
                    updateParams({ sub: next.length > 0 ? next : null });
                  }}
                  className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
                />
                <span className="text-sm text-white/60 group-hover:text-white transition-colors">
                  {sub.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Draw Weight */}
      <div>
        <label className="text-xs font-bold tracking-wider uppercase text-white/60 mb-3 block">
          Draw Weight (lbs)
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={searchParams.get("drawWeightMin") ?? ""}
            onChange={(e) => updateParams({ drawWeightMin: e.target.value || null })}
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
          />
          <span className="text-white/30">—</span>
          <input
            type="number"
            placeholder="Max"
            value={searchParams.get("drawWeightMax") ?? ""}
            onChange={(e) => updateParams({ drawWeightMax: e.target.value || null })}
            className="w-full bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Hand Orientation */}
      <div>
        <label className="text-xs font-bold tracking-wider uppercase text-white/60 mb-3 block">
          Hand Orientation
        </label>
        <div className="flex gap-2">
          {["Right Hand", "Left Hand"].map((h) => (
            <button
              key={h}
              onClick={() => updateParams({ hand: hand === h ? null : h })}
              className={`px-4 py-2 text-xs font-medium rounded-lg border transition-colors ${
                hand === h
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-white/10 text-white/60 hover:border-white/20"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* In Stock */}
      <label className="flex items-center gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={inStock}
          onChange={(e) => updateParams({ inStock: e.target.checked ? "true" : null })}
          className="rounded border-white/20 bg-white/5 text-primary focus:ring-primary"
        />
        <span className="text-sm text-white/60 group-hover:text-white transition-colors">
          In Stock Only
        </span>
      </label>
    </aside>
  );
}
