"use client";

import Link from "next/link";
import { useWishlistStore } from "@/store/wishlist-store";

export function WishlistCount() {
  const count = useWishlistStore((s) => s.items.length);

  if (count === 0) {
    return <p className="text-sm text-white/40">Your wishlist is empty.</p>;
  }

  return (
    <Link
      href="/account/wishlist"
      className="group block"
    >
      <span className="text-3xl font-bold text-white group-hover:text-primary transition-colors">
        {count}
      </span>
      <span className="text-sm text-white/50 ml-2">
        {count === 1 ? "item" : "items"} saved
      </span>
    </Link>
  );
}
