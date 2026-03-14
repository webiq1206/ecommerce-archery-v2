"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus } from "lucide-react";

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  variants?: Array<{ id: string; name: string; price?: string | null }>;
  basePrice: string;
}

export function AddToCartButton({ productId, productName, variants, basePrice }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleAddToCart = async () => {
    if (variants && variants.length > 0 && !selectedVariant) {
      setMessage("Please select an option first.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const sessionId = getSessionId();
      const res = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId: selectedVariant || undefined, quantity, sessionId }),
      });
      if (res.ok) {
        setMessage(`${quantity}x ${productName} added to cart!`);
      } else {
        setMessage("Failed to add to cart.");
      }
    } catch {
      setMessage("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {variants && variants.length > 0 && (
        <div className="mb-8">
          <h4 className="font-bold mb-3 flex items-center justify-between">
            Select Option
            {selectedVariant && <span className="text-primary text-sm">Selected</span>}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => setSelectedVariant(variant.id)}
                className={`px-4 py-3 rounded-xl border text-sm text-left transition-all ${
                  selectedVariant === variant.id
                    ? "border-primary bg-primary/5 text-primary font-bold shadow-sm shadow-primary/10"
                    : "border-border hover:border-foreground/30 bg-card"
                }`}
              >
                <div className="block">{variant.name}</div>
                {variant.price && variant.price !== basePrice && (
                  <div className="text-xs mt-1 opacity-70">
                    +${(parseFloat(variant.price) - parseFloat(basePrice)).toFixed(2)}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <hr className="my-8 border-border" />

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center border border-border rounded-xl bg-card h-14">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 h-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={loading}
          className="flex-1 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {loading ? "Adding..." : (
            <>
              <ShoppingCart className="w-5 h-5" /> Add to Cart
            </>
          )}
        </button>
      </div>

      {message && (
        <p className={`text-sm ${message.includes("added") ? "text-green-600" : "text-destructive"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("apex_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("apex_session_id", id);
  }
  return id;
}
