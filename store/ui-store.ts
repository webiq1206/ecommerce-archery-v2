"use client";

import { create } from "zustand";

interface UIState {
  isMobileMenuOpen: boolean;
  isAIDrawerOpen: boolean;
  isSearchOpen: boolean;
  recentlyViewed: string[];
  setMobileMenuOpen: (open: boolean) => void;
  setAIDrawerOpen: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  addRecentlyViewed: (productId: string) => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isMobileMenuOpen: false,
  isAIDrawerOpen: false,
  isSearchOpen: false,
  recentlyViewed: [],

  setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
  setAIDrawerOpen: (open) => set({ isAIDrawerOpen: open }),
  setSearchOpen: (open) => set({ isSearchOpen: open }),

  addRecentlyViewed: (productId) =>
    set((state) => ({
      recentlyViewed: [
        productId,
        ...state.recentlyViewed.filter((id) => id !== productId),
      ].slice(0, 20),
    })),
}));
