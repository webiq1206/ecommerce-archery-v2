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

export function ProductList({ products }: { products: Product[] }) {
  return (
    <div className="space-y-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} mode="list" />
      ))}
    </div>
  );
}
