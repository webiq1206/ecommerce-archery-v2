"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { VariantSelector } from "@/components/product/VariantSelector";

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

interface QuickViewProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  images: { url: string; altText: string | null }[];
  brand?: { name: string; slug: string } | null;
  variants?: Variant[];
}

export function ProductCardQuick({
  product,
  open,
  onOpenChange,
}: {
  product: QuickViewProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const images = product.images.length > 0 ? product.images : [{ url: "/images/product-bow-1.png", altText: product.name }];

  const hasVariants = product.variants && product.variants.length > 0;
  const displayPrice = selectedVariant?.price ?? product.price;
  const needsVariantSelection = hasVariants && !selectedVariant;

  const handleVariantChange = useCallback(
    (variant: Variant | null) => {
      setSelectedVariant(variant);
      if (variant?.imageUrl) {
        const idx = images.findIndex((img) => img.url === variant.imageUrl);
        if (idx !== -1) setSelectedImage(idx);
      }
    },
    [images]
  );

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      variantId: selectedVariant?.id ?? null,
      name: product.name,
      slug: product.slug,
      price: parseFloat(displayPrice),
      image: images[0].url,
      variant: selectedVariant?.name,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 z-[100] animate-in fade-in duration-200" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card rounded-2xl z-[110] w-[90vw] max-w-3xl max-h-[85vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          <Dialog.Close className="absolute top-4 right-4 p-2 text-white/50 hover:text-white z-10">
            <X className="w-5 h-5" />
          </Dialog.Close>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative aspect-square bg-background">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[selectedImage]?.url}
                alt={images[selectedImage]?.altText ?? product.name}
                className="w-full h-full object-cover"
              />
              {images.length > 1 && (
                <div className="absolute bottom-3 left-3 flex gap-2">
                  {images.slice(0, 5).map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-12 h-12 rounded-md overflow-hidden border-2 transition-colors ${
                        i === selectedImage ? "border-primary" : "border-transparent"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-8 flex flex-col">
              {product.brand && (
                <Link href={`/brands/${product.brand.slug}`} className="text-xs font-semibold tracking-wider uppercase text-secondary-foreground hover:text-primary transition-colors mb-1">
                  {product.brand.name}
                </Link>
              )}
              <Dialog.Title className="font-display text-2xl text-white mb-4 normal-case">
                {product.name}
              </Dialog.Title>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-xl font-medium text-white">{formatPrice(displayPrice)}</span>
                {product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(displayPrice) && (
                  <span className="text-sm text-muted-foreground line-through">{formatPrice(product.compareAtPrice)}</span>
                )}
              </div>

              {hasVariants && (
                <div className="mb-6">
                  <VariantSelector
                    variants={product.variants!}
                    basePrice={product.price}
                    onVariantChange={handleVariantChange}
                  />
                </div>
              )}

              <div className="flex-1" />
              <button
                onClick={handleAddToCart}
                disabled={needsVariantSelection}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3.5 rounded-lg font-semibold uppercase tracking-wider text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20 mb-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {added ? "Added!" : needsVariantSelection ? "Select Options" : "Add to Cart"}
              </button>
              <Link
                href={`/products/${product.slug}`}
                onClick={() => onOpenChange(false)}
                className="block text-center text-sm text-white/50 hover:text-primary transition-colors"
              >
                View Full Details
              </Link>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
