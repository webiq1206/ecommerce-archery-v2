"use client";

import Link from "next/link";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { analytics } from "@/lib/analytics/track";

interface AIProductSuggestionProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    reason: string;
  };
}

export function AIProductSuggestion({ product }: AIProductSuggestionProps) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 my-3">
      <div className="flex gap-4">
        <div className="w-16 h-16 rounded-lg overflow-hidden bg-card shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate normal-case">{product.name}</h4>
          <p className="text-sm text-primary font-medium mt-0.5">{formatPrice(product.price)}</p>
          <p className="text-xs text-white/40 mt-1 line-clamp-2">{product.reason}</p>
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={() => {
                analytics.aiProductClicked({ id: product.id, name: product.name, action: "add_to_cart" });
                addItem({
                  productId: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  image: product.image,
                });
              }}
              className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Add to Cart
            </button>
            <Link
              href={`/products/${product.slug}`}
              onClick={() => analytics.aiProductClicked({ id: product.id, name: product.name, action: "view_product" })}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              View Product
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
