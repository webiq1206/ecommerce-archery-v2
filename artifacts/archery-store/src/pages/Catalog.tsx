import { useState } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Search, Filter, SlidersHorizontal, ChevronDown } from "lucide-react";

export default function Catalog() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const sortParam = searchParams.get("sort");
  const validSorts = ["newest", "price_asc", "price_desc", "name_asc"] as const;
  type SortOption = typeof validSorts[number];
  const initialSort: SortOption = validSorts.includes(sortParam as SortOption) ? (sortParam as SortOption) : "newest";
  const [sort, setSort] = useState<SortOption>(initialSort);

  const { data: categoryData } = useListCategories({});
  const { data: productData, isLoading } = useListProducts({
    category: category || undefined,
    sort,
    limit: 24
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* Catalog Header */}
      <div className="bg-secondary text-secondary-foreground py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
            {category ? category.replace('-', ' ').toUpperCase() : "ALL GEAR"}
          </h1>
          <p className="text-secondary-foreground/70 max-w-2xl mx-auto">
            Explore our complete collection of premium archery equipment.
          </p>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex flex-col lg:flex-row gap-12">
        
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <div>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 border-b pb-2">
              <Filter className="w-5 h-5 text-primary" /> Categories
            </h3>
            <ul className="space-y-3">
              <li>
                <button 
                  onClick={() => setCategory("")}
                  className={`text-sm hover:text-primary transition-colors ${!category ? "text-primary font-bold" : "text-muted-foreground"}`}
                >
                  All Products
                </button>
              </li>
              {categoryData?.map(c => (
                <li key={c.id}>
                  <button 
                    onClick={() => setCategory(c.slug)}
                    className={`text-sm hover:text-primary transition-colors ${category === c.slug ? "text-primary font-bold" : "text-muted-foreground"}`}
                  >
                    {c.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Price stub */}
          <div>
            <h3 className="font-bold text-lg mb-4 border-b pb-2">Price Range</h3>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" className="w-full bg-muted border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" />
              <span>-</span>
              <input type="number" placeholder="Max" className="w-full bg-muted border-none rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-primary outline-none" />
            </div>
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b gap-4">
            <p className="text-sm text-muted-foreground">
              Showing {productData?.products.length || 0} of {productData?.total || 0} products
            </p>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Sort by:
              </span>
              <div className="relative">
                <select 
                  value={sort}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (validSorts.includes(val as SortOption)) setSort(val as SortOption);
                  }}
                  className="appearance-none bg-muted border-none rounded-md px-4 py-2 pr-10 text-sm font-medium focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-muted rounded-2xl aspect-[3/4] mb-4" />
                  <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : productData?.products.length === 0 ? (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your filters or search criteria.</p>
              <button onClick={() => setCategory("")} className="text-primary font-bold hover:underline">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
              {productData?.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
