"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { ChevronDown } from "lucide-react";

interface Brand {
  id: string;
  name: string;
}

interface SearchControlsProps {
  brands: Brand[];
  currentSort: string;
  selectedBrands: string[];
  query: string;
}

export function SearchControls({ brands, currentSort, selectedBrands, query }: SearchControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [brandsOpen, setBrandsOpen] = useState(selectedBrands.length > 0);

  const buildUrl = useCallback(
    (overrides: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(overrides)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      params.delete("page");
      return `/search?${params.toString()}`;
    },
    [searchParams]
  );

  const handleSortChange = (sort: string) => {
    router.push(buildUrl({ sort: sort === "relevance" ? null : sort }));
  };

  const handleBrandToggle = (brandId: string) => {
    const next = selectedBrands.includes(brandId)
      ? selectedBrands.filter((id) => id !== brandId)
      : [...selectedBrands, brandId];
    router.push(buildUrl({ brands: next.length > 0 ? next.join(",") : null }));
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-6 mb-8">
      {/* Sort */}
      <div className="relative sm:ml-auto sm:order-2 shrink-0">
        <label htmlFor="search-sort" className="sr-only">Sort by</label>
        <div className="relative">
          <select
            id="search-sort"
            value={currentSort}
            onChange={(e) => handleSortChange(e.target.value)}
            className="appearance-none bg-white/5 border border-white/10 text-white/80 text-sm rounded-lg pl-4 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer hover:border-white/20 transition-colors"
          >
            <option value="relevance">Relevance</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="newest">Newest</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        </div>
      </div>

      {/* Brand filters */}
      {brands.length > 0 && (
        <div className="sm:order-1">
          <button
            onClick={() => setBrandsOpen(!brandsOpen)}
            className="flex items-center gap-2 text-sm font-medium text-white/60 hover:text-white transition-colors mb-3"
          >
            <span>Brands</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${brandsOpen ? "rotate-180" : ""}`} />
            {selectedBrands.length > 0 && (
              <span className="bg-primary/20 text-primary text-xs font-bold px-1.5 py-0.5 rounded">
                {selectedBrands.length}
              </span>
            )}
          </button>
          {brandsOpen && (
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {brands.map((brand) => (
                <label
                  key={brand.id}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand.id)}
                    onChange={() => handleBrandToggle(brand.id)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
                    {brand.name}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
