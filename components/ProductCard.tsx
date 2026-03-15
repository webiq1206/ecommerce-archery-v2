"use client";

import Link from "next/link";
import { ShoppingCart, Heart } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { ProductCardQuick } from "@/components/product/ProductCardQuick";

interface Variant {
  id: string;
  name: string;
  sku: string;
  price: string | null;
  inventory: number;
  isAvailable: boolean;
  options: Record<string, string> | null;
  imageUrl: string | null;
}

interface ProductCardProps {
  product: {
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
    variants?: Variant[];
  };
  mode?: "grid" | "list";
}

export function ProductCard({ product, mode = "grid" }: ProductCardProps) {
  const imageUrl = product.images?.[0]?.url || "/images/product-bow-1.png";
  const isSale = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);
  const savePercent = isSale
    ? Math.round((1 - parseFloat(product.price) / parseFloat(product.compareAtPrice!)) * 100)
    : 0;

  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product.id));
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: `${product.id}-default`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: parseFloat(product.price),
      image: imageUrl,
    });
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  if (mode === "list") {
    return (
      <Link href={`/products/${product.slug}`} className="group flex gap-6 p-4 bg-card rounded-xl border border-border/30 hover:border-primary/30 transition-colors">
        <div className="relative w-32 h-32 sm:w-40 sm:h-40 bg-card rounded-lg overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isNewArrival && (
              <span className="bg-white/90 text-black text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">New</span>
            )}
            {isSale && (
              <span className="bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">-{savePercent}%</span>
            )}
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            {product.brand && (
              <p className="text-xs font-semibold tracking-wider text-secondary-foreground uppercase">{product.brand.name}</p>
            )}
            <h3 className="font-display font-normal text-lg text-white group-hover:text-primary transition-colors normal-case mt-1">{product.name}</h3>
            {product.rating !== undefined && product.rating > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={`text-xs ${i < Math.round(product.rating!) ? "text-amber-400" : "text-white/10"}`}>&#9733;</span>
                  ))}
                </div>
                <span className="text-xs text-white/40">({product.reviewCount})</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2">
              <span className="font-medium text-white/90 text-lg">${product.price}</span>
              {isSale && (
                <span className="text-sm text-muted-foreground line-through">${product.compareAtPrice}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleWishlistToggle}
                className="p-2 rounded-lg text-white/40 hover:text-primary transition-colors"
                aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
              >
                <Heart className={`w-5 h-5 ${isInWishlist ? "fill-primary text-primary" : ""}`} />
              </button>
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                <ShoppingCart className="w-4 h-4" /> Add to Cart
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <>
      <div className="block">
        <div className="group/image relative aspect-[3/4] bg-card rounded-xl overflow-hidden mb-4">
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            {product.isNewArrival && (
              <span className="bg-white/90 text-black text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md">
                New
              </span>
            )}
            {isSale && (
              <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-md">
                Save {savePercent}%
              </span>
            )}
          </div>

          {/* Wishlist toggle */}
          <button
            onClick={handleWishlistToggle}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/30 backdrop-blur-sm text-white/60 hover:text-primary transition-colors"
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`w-4 h-4 ${isInWishlist ? "fill-primary text-primary" : ""}`} />
          </button>

          {/* Clickable image area opens quick view */}
          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            className="absolute inset-0 w-full h-full cursor-pointer"
            aria-label={`Quick view ${product.name}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover/image:scale-105"
            />
          </button>

          {/* Add to cart - visible by default on touch, hidden until hover on pointer devices */}
          <div className="absolute inset-x-0 bottom-0 p-3 z-10 translate-y-0 [@media(hover:hover)]:translate-y-full [@media(hover:hover)]:group-hover/image:translate-y-0 transition-transform duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold text-sm uppercase tracking-wider transition-all shadow-lg shadow-black/30 flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </button>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        <Link href={`/products/${product.slug}`} className="group/info block">
          <div className="space-y-1 px-1">
            {product.brand && (
              <p className="text-xs font-semibold tracking-wider text-secondary-foreground uppercase">
                {product.brand.name}
              </p>
            )}
            <h3 className="font-display font-normal text-lg text-white group-hover/info:text-primary transition-colors line-clamp-1 normal-case">
              {product.name}
            </h3>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white/90">${product.price}</span>
              {isSale && (
                <span className="text-sm text-muted-foreground line-through">${product.compareAtPrice}</span>
              )}
            </div>
          </div>
        </Link>
      </div>

      <ProductCardQuick
        product={product}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </>
  );
}
