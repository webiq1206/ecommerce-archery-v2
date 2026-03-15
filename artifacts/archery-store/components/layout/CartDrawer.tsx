"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCartStore, type CartItemData } from "@/store/cart-store";
import { useUIStore } from "@/store/ui-store";
import { formatPrice } from "@/lib/utils";

function CartItem({ item }: { item: CartItemData }) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-4 py-4 border-b border-white/5 animate-in slide-in-from-top-2 duration-300">
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-card shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate normal-case">{item.name}</h4>
        {item.variant && (
          <p className="text-xs text-white/40 mt-0.5">{item.variant}</p>
        )}
        <p className="text-sm font-medium text-white/90 mt-1">{formatPrice(item.price)}</p>
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center border border-white/10 rounded-md">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="p-1.5 text-white/50 hover:text-white transition-colors min-w-[30px] min-h-[30px] flex items-center justify-center"
              aria-label="Decrease quantity"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-sm font-medium text-white w-8 text-center">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="p-1.5 text-white/50 hover:text-white transition-colors min-w-[30px] min-h-[30px] flex items-center justify-center"
              aria-label="Increase quantity"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={() => removeItem(item.id)}
            className="p-1.5 text-white/30 hover:text-destructive transition-colors"
            aria-label="Remove item"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StripeExpressCheckout({ total }: { total: number }) {
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  const initPaymentRequest = useCallback(async () => {
    try {
      const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
      if (!stripeKey || typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const { loadStripe } = await import("@stripe/stripe-js");
      const stripe = await loadStripe(stripeKey);
      if (!stripe) {
        setLoading(false);
        return;
      }

      const paymentRequest = stripe.paymentRequest({
        country: "US",
        currency: "usd",
        total: {
          label: "Apex Archery",
          amount: Math.round(total * 100),
        },
        requestPayerName: true,
        requestPayerEmail: true,
        requestShipping: true,
      });

      const result = await paymentRequest.canMakePayment();
      if (result) {
        setAvailable(true);
        const elements = stripe.elements();
        const prButton = elements.create("paymentRequestButton", { paymentRequest });

        paymentRequest.on("paymentmethod", async (ev) => {
          try {
            const res = await fetch("/api/checkout/express", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                paymentMethodId: ev.paymentMethod.id,
                shipping: ev.shippingAddress,
              }),
            });
            const data = await res.json();
            if (data.error) {
              ev.complete("fail");
            } else {
              ev.complete("success");
              window.location.href = `/checkout/success?order_id=${data.orderId}`;
            }
          } catch {
            ev.complete("fail");
          }
        });

        requestAnimationFrame(() => {
          const container = document.getElementById("stripe-payment-request-btn");
          if (container) {
            prButton.mount("#stripe-payment-request-btn");
          }
        });
      }
    } catch {
      // Stripe not available
    } finally {
      setLoading(false);
    }
  }, [total]);

  useEffect(() => {
    initPaymentRequest();
  }, [initPaymentRequest]);

  if (loading || !available) return null;

  return (
    <div className="mb-3">
      <div id="stripe-payment-request-btn" className="min-h-[44px]" />
      <div className="flex items-center gap-3 mt-3 mb-1">
        <div className="flex-1 border-t border-white/10" />
        <span className="text-xs text-white/30 uppercase tracking-wider">or</span>
        <div className="flex-1 border-t border-white/10" />
      </div>
    </div>
  );
}

function RecentlyViewedStrip({ onClose }: { onClose: () => void }) {
  const recentlyViewed = useUIStore((s) => s.recentlyViewed);
  const [products, setProducts] = useState<{ id: string; name: string; slug: string; image: string; price: number }[]>([]);

  useEffect(() => {
    if (recentlyViewed.length === 0) return;
    const ids = recentlyViewed.slice(0, 6);
    fetch(`/api/products/batch?ids=${ids.join(",")}`)
      .then((r) => r.ok ? r.json() : { products: [] })
      .then((d) => setProducts(d.products ?? []))
      .catch(() => {});
  }, [recentlyViewed]);

  if (products.length === 0) return null;

  return (
    <div className="px-6 mt-6">
      <p className="text-xs font-bold tracking-[0.15em] uppercase text-white/40 mb-3">Recently Viewed</p>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            onClick={onClose}
            className="shrink-0 w-24 group"
          >
            <div className="w-24 h-24 rounded-lg overflow-hidden bg-card border border-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            </div>
            <p className="text-xs text-white/60 mt-1 truncate group-hover:text-primary transition-colors">{p.name}</p>
            <p className="text-xs font-medium text-white/80">{formatPrice(p.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

function EmptyCartState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center overflow-y-auto">
      <ShoppingBag className="w-16 h-16 text-white/10 mb-6" />
      <p className="text-white/50 text-lg mb-2">Your cart is empty</p>
      <p className="text-white/30 text-sm mb-8">Add some gear to get started</p>
      <Link
        href="/products"
        onClick={onClose}
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-lg font-semibold uppercase tracking-wider text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20"
      >
        Start Shopping
      </Link>
      <RecentlyViewedStrip onClose={onClose} />
    </div>
  );
}

export function CartDrawer() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeDrawer = useCartStore((s) => s.closeDrawer);
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[80]"
          onClick={closeDrawer}
        />
      )}
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-background z-[90] transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="font-display text-lg tracking-wider uppercase text-white">
            Your Cart ({items.reduce((s, i) => s + i.quantity, 0)} items)
          </h2>
          <button
            onClick={closeDrawer}
            className="p-2 text-white/50 hover:text-white transition-colors"
            aria-label="Close cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyCartState onClose={closeDrawer} />
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
            <div className="border-t border-white/5 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-white/60 text-sm">Subtotal</span>
                <span className="text-lg font-medium text-white">{formatPrice(subtotal())}</span>
              </div>
              <p className="text-xs text-white/30">
                Taxes and shipping calculated at checkout
              </p>
              <StripeExpressCheckout total={subtotal()} />
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="block w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-lg font-semibold text-center uppercase tracking-wider text-sm transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20"
              >
                Checkout
              </Link>
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="block text-center text-sm text-white/50 hover:text-white transition-colors"
              >
                View Full Cart
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
