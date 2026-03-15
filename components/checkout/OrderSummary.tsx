"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { CartItemData } from "@/store/cart-store";

interface OrderSummaryProps {
  items: CartItemData[];
  subtotal: number;
  shippingCost: number;
  taxTotal: number;
  discount: number;
  total: number;
  promoCode: string;
  onPromoChange: (code: string) => void;
  onApplyPromo: () => void;
}

export function OrderSummary({
  items,
  subtotal,
  shippingCost,
  taxTotal,
  discount,
  total,
  promoCode,
  onPromoChange,
  onApplyPromo,
}: OrderSummaryProps) {
  return (
    <div className="sticky top-28 bg-card rounded-2xl p-6 space-y-6">
      <h3 className="font-display text-lg text-white">Order Summary</h3>
      <div className="space-y-4 max-h-64 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-background shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              <span className="absolute -top-1 -right-1 bg-white/80 text-black text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full">
                {item.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate normal-case">{item.name}</p>
              {item.variant && <p className="text-xs text-white/40">{item.variant}</p>}
            </div>
            <span className="text-sm text-white">{formatPrice(item.price * item.quantity)}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={promoCode}
          onChange={(e) => onPromoChange(e.target.value)}
          placeholder="Promo code"
          className="flex-1 bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:border-primary"
        />
        <button
          onClick={onApplyPromo}
          className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70 hover:text-white transition-colors"
        >
          Apply
        </button>
      </div>

      <div className="space-y-2 text-sm border-t border-white/5 pt-4">
        <div className="flex justify-between text-white/50">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-green-400">
            <span>Discount</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-white/50">
          <span>Shipping</span>
          <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
        </div>
        <div className="flex justify-between text-white/50">
          <span>Tax (estimated)</span>
          <span>{formatPrice(taxTotal)}</span>
        </div>
        <div className="flex justify-between text-white font-medium text-lg pt-2 border-t border-white/5">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}

export function MobileSummaryToggle({ items, total }: { items: CartItemData[]; total: number }) {
  const [show, setShow] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setShow(!show)}
        className="w-full flex items-center justify-between bg-card rounded-xl p-4 mb-6"
      >
        <span className="text-sm text-white/60">Order Summary ({items.length} items)</span>
        <div className="flex items-center gap-2">
          <span className="font-medium text-white">{formatPrice(total)}</span>
          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${show ? "rotate-180" : ""}`} />
        </div>
      </button>
      {show && (
        <div className="bg-card rounded-xl p-4 mb-6 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-md overflow-hidden bg-background shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate normal-case">{item.name}</p>
                <p className="text-xs text-white/40">Qty: {item.quantity}</p>
              </div>
              <span className="text-sm text-white">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
