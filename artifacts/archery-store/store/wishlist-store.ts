"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { analytics } from "@/lib/analytics/track";

interface WishlistState {
  items: string[];
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  toggleItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  count: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (productId) => {
        analytics.wishlistAdded(productId, productId);
        set((state) => ({
          items: state.items.includes(productId)
            ? state.items
            : [...state.items, productId],
        }));
      },

      removeItem: (productId) => {
        analytics.wishlistRemoved(productId);
        set((state) => ({
          items: state.items.filter((id) => id !== productId),
        }));
      },

      toggleItem: (productId) => {
        const state = get();
        if (state.items.includes(productId)) {
          state.removeItem(productId);
        } else {
          state.addItem(productId);
        }
      },

      isInWishlist: (productId) => get().items.includes(productId),

      count: () => get().items.length,
    }),
    { name: "apex-wishlist" }
  )
);
