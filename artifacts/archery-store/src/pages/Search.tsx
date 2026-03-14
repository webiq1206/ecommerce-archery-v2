import { useLocation, Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard } from "@/components/product/ProductCard";
import { useSearchProducts } from "@workspace/api-client-react";
import { useState } from "react";
import { SearchIcon } from "lucide-react";

export default function Search() {
  const searchParams = new URLSearchParams(window.location.search);
  const q = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(q);
  const [, navigate] = useLocation();
  const { data, isLoading } = useSearchProducts({ q: q || "", limit: 24 });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="bg-secondary py-16">
          <div className="max-w-3xl mx-auto px-4">
            <h1 className="font-display text-4xl font-bold text-center mb-8">Search</h1>
            <form onSubmit={handleSearch} className="flex gap-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search bows, arrows, accessories..."
                className="flex-1 px-6 py-4 rounded-xl border border-border bg-background text-foreground text-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button type="submit" className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-semibold flex items-center gap-2">
                <SearchIcon className="w-5 h-5" /> Search
              </button>
            </form>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {q && (
            <p className="text-muted-foreground mb-8">
              {isLoading ? "Searching..." : `${data?.total ?? 0} results for "${q}"`}
            </p>
          )}

          {data?.products && data.products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : q && !isLoading ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground mb-4">No products found for "{q}"</p>
              <Link href="/products" className="text-primary font-medium hover:underline">
                Browse all products
              </Link>
            </div>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
