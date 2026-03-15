"use client";

import posthog from "posthog-js";

function capture(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== "undefined" && posthog.__loaded) {
    posthog.capture(event, properties);
  }
}

export const analytics = {
  productViewed: (product: { id: string; name: string; price: string; category?: string }) => {
    capture("product_viewed", product);
  },

  addedToCart: (item: { productId: string; name: string; price: number; quantity: number; variant?: string }) => {
    capture("added_to_cart", item);
  },

  removedFromCart: (item: { productId: string; name: string }) => {
    capture("removed_from_cart", item);
  },

  cartViewed: (itemCount: number, subtotal: number) => {
    capture("cart_viewed", { itemCount, subtotal });
  },

  checkoutStarted: (itemCount: number, subtotal: number) => {
    capture("checkout_started", { itemCount, subtotal });
  },

  checkoutStepCompleted: (step: string) => {
    capture("checkout_step_completed", { step });
  },

  orderCompleted: (orderId: string, total: number) => {
    capture("order_completed", { orderId, total });
  },

  searchPerformed: (query: string, resultCount: number) => {
    capture("search_performed", { query, resultCount });
  },

  wishlistAdded: (productId: string, name: string) => {
    capture("wishlist_added", { productId, name });
  },

  wishlistRemoved: (productId: string) => {
    capture("wishlist_removed", { productId });
  },

  aiConversationStarted: () => {
    capture("ai_conversation_started");
  },

  aiMessageSent: (message: string) => {
    capture("ai_message_sent", { messageLength: message.length });
  },

  categoryViewed: (category: string) => {
    capture("category_viewed", { category });
  },

  collectionViewed: (collection: string) => {
    capture("collection_viewed", { collection });
  },

  cartOpened: () => {
    capture("cart_opened");
  },

  filterApplied: (filter: { type: string; value: string }) => {
    capture("filter_applied", filter);
  },

  aiProductClicked: (product: { id: string; name: string; action: string }) => {
    capture("ai_product_clicked", product);
  },

  emailSubscribed: (source: string) => {
    capture("email_subscribed", { source });
  },

  guideViewed: (guide: { slug: string; title: string }) => {
    capture("guide_viewed", guide);
  },

  purchase: (data: { orderId: string; revenue: number; items: number }) => {
    capture("purchase", data);
  },
};
