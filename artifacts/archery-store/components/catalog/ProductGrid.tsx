"use client";

import { ProductCard } from "@/components/ProductCard";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  isNewArrival?: boolean | null;
  isFeatured?: boolean | null;
  images: Array<{ id: string; url: string; altText: string | null; sortOrder: number }>;
  brand?: { id: string; name: string; slug: string } | null;
  reviewCount?: number;
  rating?: number;
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} mode="grid" />
      ))}
    </div>
  );
}
