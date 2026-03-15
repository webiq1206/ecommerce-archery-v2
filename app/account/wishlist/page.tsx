"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore } from "@/store/cart-store";

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice: string | null;
  imageUrl: string | null;
}

export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const removeItem = useWishlistStore((s) => s.removeItem);
  const addToCart = useCartStore((s) => s.addItem);
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    items.forEach((id) => params.append("ids", id));

    fetch(`/api/products?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { products: [] }))
      .then((data) => {
        const fetched: WishlistProduct[] = (data.products ?? []).map(
          (p: Record<string, unknown>) => ({
            id: p.id as string,
            name: p.name as string,
            slug: p.slug as string,
            price: p.price as string,
            compareAtPrice: (p.compareAtPrice as string | null) ?? null,
            imageUrl:
              ((p.images as Array<{ url: string }>) ?? [])[0]?.url ?? null,
          })
        );
        setProducts(fetched);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [items]);

  const handleAddToCart = (product: WishlistProduct) => {
    addToCart({
      id: `${product.id}-default`,
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: parseFloat(product.price),
      image: product.imageUrl ?? "/images/product-bow-1.png",
    });
  };

  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wider mb-8">
        Wishlist
      </h1>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-white/40" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl bg-card border border-white/5 p-8 text-center">
          <Heart className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 mb-6">Your wishlist is empty.</p>
          <Link
            href="/products"
            className="inline-block bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-medium text-sm uppercase tracking-wider transition-colors"
          >
            Shop Now
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((productId) => {
            const product = products.find((p) => p.id === productId);

            return (
              <div
                key={productId}
                className="rounded-xl bg-card border border-white/5 overflow-hidden"
              >
                <Link
                  href={product ? `/products/${product.slug}` : "#"}
                  className="block"
                >
                  <div className="aspect-[4/3] bg-white/5 overflow-hidden">
                    {product?.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
                        No Image
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4">
                  {product ? (
                    <>
                      <Link
                        href={`/products/${product.slug}`}
                        className="block font-display text-white hover:text-primary transition-colors line-clamp-1 mb-1"
                      >
                        {product.name}
                      </Link>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="font-medium text-white/90">
                          ${Number(product.price).toFixed(2)}
                        </span>
                        {product.compareAtPrice &&
                          parseFloat(product.compareAtPrice) >
                            parseFloat(product.price) && (
                            <span className="text-sm text-white/40 line-through">
                              ${Number(product.compareAtPrice).toFixed(2)}
                            </span>
                          )}
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-white/40 mb-4">
                      Product unavailable
                    </p>
                  )}
                  <div className="flex gap-2">
                    {product && (
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    )}
                    <button
                      onClick={() => removeItem(productId)}
                      className="p-2 rounded-lg text-white/40 hover:text-destructive hover:bg-white/5 transition-colors"
                      aria-label="Remove from wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
