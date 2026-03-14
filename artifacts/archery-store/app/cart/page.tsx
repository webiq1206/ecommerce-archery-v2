"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Trash2, Minus, Plus, ArrowRight, CheckCircle } from "lucide-react";

interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: {
    name: string;
    slug: string;
    price: string;
    imageUrl: string | null;
  };
}

function getSessionId(): string {
  let id = localStorage.getItem("apex_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("apex_session_id", id);
  }
  return id;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<{ sessionId: string; mode: string } | null>(null);

  const fetchCart = useCallback(async () => {
    const sessionId = getSessionId();
    const res = await fetch(`/api/cart?sessionId=${sessionId}`);
    if (res.ok) {
      const data = await res.json();
      setCartItems(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    await fetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, quantity: newQty }),
    });
    fetchCart();
  };

  const handleRemove = async (itemId: string) => {
    await fetch(`/api/cart?itemId=${itemId}`, { method: "DELETE" });
    fetchCart();
  };

  const handleCheckout = async () => {
    setCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId || undefined,
            quantity: item.quantity,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCheckoutResult(data);
      }
    } catch {
      alert("Checkout failed. Please try again.");
    } finally {
      setCheckingOut(false);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + parseFloat(item.product.price) * item.quantity, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 pt-28 pb-16 text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (checkoutResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 pt-28 pb-16 text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
        <h1 className="font-display text-4xl font-normal mb-4">Checkout Initiated</h1>
        <p className="text-muted-foreground mb-2">
          {checkoutResult.mode === "stub"
            ? "Stripe is not configured — this is a test checkout."
            : "Your payment is being processed."}
        </p>
        <p className="text-sm text-muted-foreground mb-8">Session ID: {checkoutResult.sessionId}</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold"
        >
          Continue Shopping <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
      <h1 className="font-display text-4xl font-normal mb-10">Your Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-20 bg-card border rounded-3xl">
          <p className="text-xl text-muted-foreground mb-6">Your cart is empty.</p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold transition-transform hover:-translate-y-0.5 shadow-lg shadow-primary/20"
          >
            Continue Shopping <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-6 p-6 bg-card border border-border/50 rounded-3xl shadow-sm">
                <div className="w-24 h-32 bg-muted rounded-xl overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.product.imageUrl || "/images/product-bow-1.png"}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/products/${item.productId}`} className="font-display font-normal text-lg hover:text-primary transition-colors">
                      {item.product.name}
                    </Link>
                    <span className="font-bold text-lg">${item.product.price}</span>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border border-border rounded-lg bg-background">
                      <button onClick={() => handleUpdateQty(item.id, item.quantity - 1)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => handleUpdateQty(item.id, item.quantity + 1)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => handleRemove(item.id)} className="text-muted-foreground hover:text-destructive flex items-center gap-1 text-sm transition-colors">
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-secondary text-secondary-foreground p-8 rounded-3xl sticky top-28">
              <h3 className="font-display font-normal text-2xl mb-6">Order Summary</h3>
              <div className="space-y-4 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-secondary-foreground/70">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-foreground/70">Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
              </div>
              <div className="border-t border-secondary-foreground/10 pt-6 mb-8 flex justify-between items-end">
                <span className="font-bold text-lg">Total</span>
                <span className="font-display font-bold text-3xl text-primary">${subtotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 shadow-lg shadow-black/20 disabled:opacity-50"
              >
                {checkingOut ? "Processing..." : (
                  <>Proceed to Checkout <ArrowRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
