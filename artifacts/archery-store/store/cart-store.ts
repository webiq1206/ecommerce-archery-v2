"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { analytics } from "@/lib/analytics/track";

export interface CartItemData {
  id: string;
  productId: string;
  variantId?: string | null;
  name: string;
  slug: string;
  price: number;
  image: string;
  variant?: string;
  quantity: number;
}

interface CartState {
  items: CartItemData[];
  isOpen: boolean;
  sessionId: string;
  toggleDrawer: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (item: Omit<CartItemData, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("apex_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("apex_session_id", id);
  }
  return id;
}

function syncToServer(items: CartItemData[], sessionId: string) {
  if (typeof window === "undefined" || !sessionId) return;
  fetch("/api/cart/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, items }),
  }).catch(() => {});
}

async function hydrateFromServer(sessionId: string): Promise<CartItemData[]> {
  if (typeof window === "undefined" || !sessionId) return [];
  try {
    const res = await fetch(`/api/cart?sessionId=${sessionId}`);
    if (!res.ok) return [];
    const serverItems: { id: string; productId: string; variantId?: string; quantity: number; product: { name: string; slug: string; price: string; imageUrl: string | null } }[] = await res.json();
    return serverItems.map((si) => ({
      id: `${si.productId}-${si.variantId ?? "default"}`,
      productId: si.productId,
      variantId: si.variantId ?? null,
      name: si.product.name,
      slug: si.product.slug,
      price: parseFloat(si.product.price),
      image: si.product.imageUrl ?? "",
      quantity: si.quantity,
    }));
  } catch {
    return [];
  }
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      sessionId: "",

      toggleDrawer: () => set((s) => ({ isOpen: !s.isOpen })),
      openDrawer: () => {
        analytics.cartOpened();
        set({ isOpen: true });
      },
      closeDrawer: () => set({ isOpen: false }),

      addItem: (item) => {
        set((state) => {
          const sid = state.sessionId || getOrCreateSessionId();
          const key = `${item.productId}-${item.variantId ?? "default"}`;
          const existing = state.items.find(
            (i) => `${i.productId}-${i.variantId ?? "default"}` === key
          );
          let nextItems: CartItemData[];
          if (existing) {
            nextItems = state.items.map((i) =>
              `${i.productId}-${i.variantId ?? "default"}` === key
                ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
                : i
            );
          } else {
            nextItems = [
              { ...item, quantity: item.quantity ?? 1, id: key },
              ...state.items,
            ];
          }
          syncToServer(nextItems, sid);
          analytics.addedToCart({
            productId: item.productId,
            name: item.name,
            price: item.price ?? parseFloat(String(item.price)),
            quantity: item.quantity ?? 1,
            variant: item.variant,
          });
          return { items: nextItems, isOpen: true, sessionId: sid };
        });
      },

      removeItem: (id) => {
        set((state) => {
          const removed = state.items.find((i) => i.id === id);
          if (removed) analytics.removedFromCart({ productId: removed.productId, name: removed.name });
          const nextItems = state.items.filter((i) => i.id !== id);
          syncToServer(nextItems, state.sessionId);
          return { items: nextItems };
        });
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          const nextItems =
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i));
          syncToServer(nextItems, state.sessionId);
          return { items: nextItems };
        });
      },

      clearCart: () => {
        const state = get();
        syncToServer([], state.sessionId);
        set({ items: [] });
      },

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: "apex-cart",
      partialize: (state) => ({
        items: state.items,
        sessionId: state.sessionId,
      }),
      onRehydrate: () => {
        return (state) => {
          if (!state) return;
          if (!state.sessionId) {
            state.sessionId = getOrCreateSessionId();
          }
          const sid = state.sessionId;
          if (sid) {
            hydrateFromServer(sid).then((serverItems) => {
              if (serverItems.length === 0) return;
              const store = useCartStore.getState();
              const localIds = new Set(store.items.map((i) => i.id));
              const newItems = serverItems.filter((si) => !localIds.has(si.id));
              if (newItems.length > 0) {
                useCartStore.setState({ items: [...store.items, ...newItems] });
              }
            });
          }
        };
      },
    }
  )
);
