"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, Heart, Share2, Check } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { formatPrice } from "@/lib/utils";

interface AddToCartProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
  };
  variant?: string;
  variantId?: string;
  available: boolean;
  maxQuantity?: number;
}

function AddToCartToast({ productName, onDismiss }: { productName: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="flex items-center gap-3 bg-card border border-white/10 shadow-2xl rounded-xl px-5 py-3.5">
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
          <Check className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">Added to cart!</p>
          <p className="text-xs text-white/50 truncate max-w-[200px]">{productName}</p>
        </div>
        <button onClick={onDismiss} className="ml-2 text-white/30 hover:text-white text-xs">✕</button>
      </div>
    </div>,
    document.body
  );
}

function StripePaymentRequestButton({ total, label }: { total: number; label: string }) {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  const init = useCallback(async () => {
    try {
      const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!stripeKey || typeof window === "undefined") { setLoading(false); return; }

      const { loadStripe } = await import("@stripe/stripe-js");
      const stripe = await loadStripe(stripeKey);
      if (!stripe) { setLoading(false); return; }

      const paymentRequest = stripe.paymentRequest({
        country: "US",
        currency: "usd",
        total: { label, amount: Math.round(total * 100) },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      const result = await paymentRequest.canMakePayment();
      if (result) {
        setAvailable(true);
        const elements = stripe.elements();
        const prButton = elements.create("paymentRequestButton", { paymentRequest });
        requestAnimationFrame(() => {
          const container = document.getElementById("pdp-payment-request-btn");
          if (container) prButton.mount("#pdp-payment-request-btn");
        });
      }
    } catch {
      // Stripe not available
    } finally {
      setLoading(false);
    }
  }, [total, label]);

  useEffect(() => { init(); }, [init]);

  if (loading || !available) return null;

  return (
    <div>
      <div className="flex items-center gap-3 my-3">
        <div className="flex-1 border-t border-white/10" />
        <span className="text-xs text-white/30 uppercase tracking-wider">or</span>
        <div className="flex-1 border-t border-white/10" />
      </div>
      <div id="pdp-payment-request-btn" className="min-h-[44px]" />
    </div>
  );
}

export function AddToCart({ product, variant, variantId, available, maxQuantity = 99 }: AddToCartProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) => s.isInWishlist(product.id));

  const handleAdd = () => {
    if (!available) return;
    addItem({
      productId: product.id,
      variantId,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.image,
      variant,
      quantity,
    });
    setAdded(true);
    setShowToast(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/products/${product.slug}`;
    if (navigator.share) {
      await navigator.share({ title: product.name, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center border border-white/10 rounded-lg">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="p-3 text-white/50 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-white w-10 text-center">{quantity}</span>
          <button
            onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))}
            className="p-3 text-white/50 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={!available}
        className={`w-full py-4 rounded-lg font-semibold uppercase tracking-wider text-sm transition-all ${
          available
            ? "bg-primary hover:bg-primary/90 text-primary-foreground hover:-translate-y-0.5 shadow-lg shadow-primary/20"
            : "bg-white/10 text-white/30 cursor-not-allowed"
        }`}
      >
        {!available ? "Out of Stock" : added ? "Added to Cart!" : "Add to Cart"}
      </button>

      <StripePaymentRequestButton total={product.price * quantity} label={product.name} />

      <div className="flex items-center gap-4">
        <button
          onClick={() => toggleWishlist(product.id)}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-primary transition-colors min-h-[44px]"
        >
          <Heart className={`w-4 h-4 ${isInWishlist ? "fill-primary text-primary" : ""}`} />
          {isInWishlist ? "Saved" : "Save to Wishlist"}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors min-h-[44px]"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>

      {showToast && (
        <AddToCartToast productName={product.name} onDismiss={() => setShowToast(false)} />
      )}
    </div>
  );
}
