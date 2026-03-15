"use client";

import Link from "next/link";
import { Trash2, Minus, Plus, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart-store";

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
      <h1 className="font-display text-4xl font-normal mb-10">Your Cart</h1>

      {items.length === 0 ? (
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
            {items.map((item) => (
              <div key={item.id} className="flex gap-6 p-6 bg-card border border-border/50 rounded-3xl shadow-sm">
                <div className="w-24 h-32 bg-muted rounded-xl overflow-hidden shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image || "/images/product-bow-1.png"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/products/${item.slug}`} className="font-display font-normal text-lg hover:text-primary transition-colors">
                      {item.name}
                    </Link>
                    <span className="font-bold text-lg">${item.price.toFixed(2)}</span>
                  </div>
                  {item.variant && (
                    <span className="text-sm text-muted-foreground mb-2">{item.variant}</span>
                  )}
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center border border-border rounded-lg bg-background">
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive flex items-center gap-1 text-sm transition-colors">
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
                  <span className="font-medium">${subtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary-foreground/70">Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
              </div>
              <div className="border-t border-secondary-foreground/10 pt-6 mb-8 flex justify-between items-end">
                <span className="font-bold text-lg">Total</span>
                <span className="font-display font-bold text-3xl text-primary">${subtotal().toFixed(2)}</span>
              </div>
              <Link
                href="/checkout"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 shadow-lg shadow-black/20"
              >
                Proceed to Checkout <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
