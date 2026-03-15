"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Star, Truck } from "lucide-react";
import { VariantSelector } from "./VariantSelector";
import { AddToCart } from "./AddToCart";
import { StickyATC } from "./StickyATC";
import { formatPrice } from "@/lib/utils";

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

interface ProductInfoProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    compareAtPrice?: string | null;
    shortDescription?: string | null;
    images: { url: string }[];
  };
  brand?: { name: string; slug: string } | null;
  category?: { name: string; slug: string } | null;
  variants: Variant[];
  averageRating: number;
  reviewCount: number;
  totalInventory: number;
}

export function ProductInfo({
  product,
  brand,
  category,
  variants,
  averageRating,
  reviewCount,
  totalInventory,
}: ProductInfoProps) {
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);

  const currentPrice = selectedVariant?.price
    ? parseFloat(selectedVariant.price)
    : parseFloat(product.price);

  const available = selectedVariant
    ? selectedVariant.isAvailable && selectedVariant.inventory > 0
    : totalInventory > 0 || variants.length === 0;

  const currentInventory = selectedVariant
    ? selectedVariant.inventory
    : totalInventory;

  const variantLabel = selectedVariant?.options
    ? Object.values(selectedVariant.options).join(" / ")
    : undefined;

  const image = product.images[0]?.url ?? "/images/product-bow-1.png";

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-white/40">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        {category && (
          <>
            <Link href={`/categories/${category.slug}`} className="hover:text-primary transition-colors">{category.name}</Link>
            <ChevronRight className="w-3 h-3" />
          </>
        )}
        <span className="text-white/60 truncate">{product.name}</span>
      </nav>

      {/* Brand */}
      {brand && (
        <Link
          href={`/brands/${brand.slug}`}
          className="text-xs font-semibold tracking-wider uppercase text-secondary-foreground hover:text-primary transition-colors"
        >
          {brand.name}
        </Link>
      )}

      {/* Title */}
      <h1 className="font-display text-3xl md:text-4xl font-normal text-white normal-case leading-tight">
        {product.name}
      </h1>

      {/* Rating */}
      {reviewCount > 0 && (
        <a href="#reviews-section" className="flex items-center gap-2 group">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i <= Math.round(averageRating) ? "fill-primary text-primary" : "text-white/20"}`}
              />
            ))}
          </div>
          <span className="text-sm text-white/50 group-hover:text-primary transition-colors">
            ({reviewCount} reviews)
          </span>
        </a>
      )}

      {/* Price */}
      <div className="flex items-center gap-3">
        <span className="text-2xl font-medium text-white">{formatPrice(currentPrice)}</span>
        {product.compareAtPrice && parseFloat(product.compareAtPrice) > currentPrice && (
          <span className="text-lg text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
        )}
      </div>

      {/* Short Description */}
      {product.shortDescription && (
        <p className="text-sm text-white/50 leading-relaxed">{product.shortDescription}</p>
      )}

      {/* Variant Selector */}
      <VariantSelector
        variants={variants}
        basePrice={product.price}
        onVariantChange={setSelectedVariant}
      />

      {/* Shipping + Stock */}
      <div className="flex items-center gap-3 text-sm text-white/50 py-2 border-y border-white/5">
        <Truck className="w-4 h-4 text-primary" />
        <span>Usually ships in 2-3 business days · Free shipping over $99</span>
      </div>
      <div className="text-sm">
        {!available ? (
          <span className="text-destructive font-medium">Out of Stock</span>
        ) : currentInventory <= 5 && currentInventory > 0 ? (
          <span className="text-primary font-medium">Only {currentInventory} left</span>
        ) : (
          <span className="text-green-400 font-medium">In Stock</span>
        )}
      </div>

      {/* Add to Cart */}
      <div id="main-atc">
        <AddToCart
          product={{ ...product, price: currentPrice, image }}
          variant={variantLabel}
          variantId={selectedVariant?.id}
          available={available}
          maxQuantity={currentInventory || 99}
        />
      </div>

      {/* Sticky ATC */}
      <StickyATC
        product={{ ...product, price: currentPrice, image }}
        variant={variantLabel}
        variantId={selectedVariant?.id}
        available={available}
        observeSelector="#main-atc"
      />
    </div>
  );
}
