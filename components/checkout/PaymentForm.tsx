"use client";

import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { loadStripe, type Stripe, type StripeElements } from "@stripe/stripe-js";
import { Loader2, Lock } from "lucide-react";

interface PaymentFormProps {
  clientSecret: string | null;
  onReady: () => void;
}

export interface PaymentFormHandle {
  confirmPayment: (returnUrl: string) => Promise<{ error?: { message?: string } }>;
}

let stripePromise: Promise<Stripe | null> | null = null;

function getStripe() {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    stripePromise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return stripePromise;
}

export const PaymentForm = forwardRef<PaymentFormHandle, PaymentFormProps>(
  function PaymentForm({ clientSecret, onReady }, ref) {
    const [stripe, setStripe] = useState<Stripe | null>(null);
    const [elements, setElements] = useState<StripeElements | null>(null);
    const [loading, setLoading] = useState(true);

    useImperativeHandle(ref, () => ({
      async confirmPayment(returnUrl: string) {
        if (!stripe || !elements) {
          return { error: { message: "Payment system unavailable" } };
        }
        return stripe.confirmPayment({
          elements,
          confirmParams: { return_url: returnUrl },
        });
      },
    }), [stripe, elements]);

    useEffect(() => {
      if (!clientSecret) return;

      getStripe().then((s) => {
        if (!s) {
          setLoading(false);
          return;
        }
        setStripe(s);
        const el = s.elements({
          clientSecret,
          appearance: {
            theme: "night",
            variables: {
              colorPrimary: "#D4AF37",
              colorBackground: "#0D0D0D",
              colorText: "#ffffff",
              colorTextSecondary: "#ffffff80",
              borderRadius: "8px",
              fontFamily: "system-ui, sans-serif",
            },
          },
        });
        setElements(el);

        const paymentElement = el.create("payment");
        const container = document.getElementById("payment-element");
        if (container) {
          paymentElement.mount("#payment-element");
          paymentElement.on("ready", () => {
            setLoading(false);
            onReady();
          });
        }
      });
    }, [clientSecret, onReady]);

    if (!clientSecret) {
      return (
        <div className="bg-card rounded-xl p-6 space-y-4">
          <p className="text-sm text-white/50">
            Complete shipping info to continue to payment.
          </p>
        </div>
      );
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      return (
        <div className="bg-card rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Lock className="w-4 h-4" />
            <span>Stripe not configured &mdash; payment will be simulated.</span>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-white/50 text-xs mb-2">
          <Lock className="w-3 h-3" />
          <span>Secured by Stripe</span>
        </div>
        <div id="payment-element" className="min-h-[200px]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-white/30" />
            </div>
          )}
        </div>
      </div>
    );
  }
);

export { getStripe };
