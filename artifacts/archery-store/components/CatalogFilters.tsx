"use client";

import { useRouter } from "next/navigation";

interface CatalogFiltersProps {
  categories: Array<{ id: string; name: string; slug: string }>;
  currentCategory: string;
  currentSort: string;
  currentMinPrice: string;
  currentMaxPrice: string;
  totalProducts: number;
}

export function CatalogFilters({
  categories,
  currentCategory,
  currentSort,
  currentMinPrice,
  currentMaxPrice,
  totalProducts,
}: CatalogFiltersProps) {
  const router = useRouter();

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    const values: Record<string, string> = {
      category: currentCategory,
      sort: currentSort,
      minPrice: currentMinPrice,
      maxPrice: currentMaxPrice,
      ...overrides,
    };
    for (const [key, value] of Object.entries(values)) {
      if (value) params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/products?${qs}` : "/products";
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/10">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <select
            value={currentCategory}
            onChange={(e) => router.push(buildUrl({ category: e.target.value }))}
            className="appearance-none bg-white/5 border border-white/10 text-white text-sm pl-4 pr-10 py-2.5 rounded-md cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:border-primary"
          >
            <option value="" className="bg-[#1a1a1a]">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug} className="bg-[#1a1a1a]">{c.name}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>

        <div className="relative">
          <select
            value={currentSort}
            onChange={(e) => router.push(buildUrl({ sort: e.target.value }))}
            className="appearance-none bg-white/5 border border-white/10 text-white text-sm pl-4 pr-10 py-2.5 rounded-md cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:border-primary"
          >
            <option value="newest" className="bg-[#1a1a1a]">Newest</option>
            <option value="price_asc" className="bg-[#1a1a1a]">Price: Low-High</option>
            <option value="price_desc" className="bg-[#1a1a1a]">Price: High-Low</option>
            <option value="name_asc" className="bg-[#1a1a1a]">A-Z</option>
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>

        <div className="relative">
          <select
            value={currentMinPrice || ""}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "") {
                router.push(buildUrl({ minPrice: "", maxPrice: "" }));
              } else {
                const [min, max] = val.split("-");
                router.push(buildUrl({ minPrice: min, maxPrice: max || "" }));
              }
            }}
            className="appearance-none bg-white/5 border border-white/10 text-white text-sm pl-4 pr-10 py-2.5 rounded-md cursor-pointer hover:bg-white/10 transition-colors focus:outline-none focus:border-primary"
          >
            <option value="" className="bg-[#1a1a1a]">Any Price</option>
            <option value="0-100" className="bg-[#1a1a1a]">Under $100</option>
            <option value="100-300" className="bg-[#1a1a1a]">$100 - $300</option>
            <option value="300-500" className="bg-[#1a1a1a]">$300 - $500</option>
            <option value="500-1000" className="bg-[#1a1a1a]">$500 - $1,000</option>
            <option value="1000-" className="bg-[#1a1a1a]">$1,000+</option>
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>

      <span className="text-sm text-white/40">{totalProducts} products</span>
    </div>
  );
}
