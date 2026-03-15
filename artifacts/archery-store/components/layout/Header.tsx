"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Heart, User, ShoppingCart, Sparkles } from "lucide-react";
import { MegaMenu } from "./MegaMenu";
import { PromoBar } from "./PromoBar";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useUIStore } from "@/store/ui-store";
import { usePathname } from "next/navigation";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHome = pathname === "/";
  const cartItemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const openCart = useCartStore((s) => s.openDrawer);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const openAI = useUIStore((s) => s.setAIDrawerOpen);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setScrolled(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const isTransparent = isHome && !scrolled;

  return (
    <>
      <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-[60px] pointer-events-none" aria-hidden="true" />
      <PromoBar />
      <header
        className={`sticky top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isTransparent
            ? "bg-transparent"
            : "bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/5 shadow-lg shadow-black/30"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center shrink-0">
            <span className="font-display font-normal text-2xl tracking-[0.25em] uppercase text-white">
              APEX<span className="text-primary">ARCHERY</span>
            </span>
          </Link>

          <MegaMenu />

          <div className="flex items-center gap-2">
            <Link
              href="/search"
              className="p-2.5 text-white/70 hover:text-primary transition-colors"
              aria-label="Search products"
            >
              <Search className="w-5 h-5" />
            </Link>

            <button
              onClick={() => openAI(true)}
              className="p-2.5 text-white/70 hover:text-primary transition-colors"
              aria-label="AI Archery Advisor"
            >
              <Sparkles className="w-5 h-5" />
            </button>

            <Link
              href="/account/wishlist"
              className="p-2.5 text-white/70 hover:text-primary transition-colors relative"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href="/account"
              className="p-2.5 text-white/70 hover:text-primary transition-colors"
              aria-label="Account"
            >
              <User className="w-5 h-5" />
            </Link>

            <button
              onClick={openCart}
              className="p-2.5 text-white/70 hover:text-primary transition-colors relative"
              aria-label="Shopping cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
