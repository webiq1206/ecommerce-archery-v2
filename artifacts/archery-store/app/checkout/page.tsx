"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";
import { analytics } from "@/lib/analytics/track";
import { ChevronRight, Loader2 } from "lucide-react";
import { checkoutSchema, type CheckoutFormData } from "@/components/checkout/checkout-schema";
import { ShippingForm } from "@/components/checkout/ShippingForm";
import { PaymentForm, type PaymentFormHandle } from "@/components/checkout/PaymentForm";
import { OrderSummary, MobileSummaryToggle } from "@/components/checkout/OrderSummary";

interface SavedAddress {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string | null;
}

type Step = "shipping" | "payment";

const inputClasses = "w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const clearCart = useCartStore((s) => s.clearCart);

  const { data: session } = useSession();
  const paymentFormRef = useRef<PaymentFormHandle>(null);

  const [step, setStep] = useState<Step>("shipping");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [sessionData, setSessionData] = useState<{ shippingCost: number; taxTotal: number; total: number } | null>(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState({
    firstName: "", lastName: "", address1: "", address2: "", city: "", state: "", zip: "", country: "US",
  });
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/account/addresses")
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setSavedAddresses(Array.isArray(data) ? data : []))
        .catch(() => {});
    }
  }, [session]);

  useEffect(() => {
    if (items.length > 0) {
      analytics.checkoutStarted(items.reduce((s, i) => s + i.quantity, 0), subtotal());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      country: "US",
      shippingMethod: "standard",
    },
  });

  const handleSelectSavedAddress = (addressId: string) => {
    const addr = savedAddresses.find((a) => a.id === addressId);
    if (!addr) return;
    setValue("firstName", addr.firstName);
    setValue("lastName", addr.lastName);
    setValue("address1", addr.address1);
    setValue("address2", addr.address2 ?? "");
    setValue("city", addr.city);
    setValue("state", addr.state);
    setValue("zip", addr.zip);
    setValue("country", addr.country);
    if (addr.phone) setValue("phone", addr.phone);
  };

  const sub = subtotal();
  const shippingCost = sessionData?.shippingCost ?? (getValues("shippingMethod") === "express" ? 14.99 : sub >= 99 ? 0 : 7.99);
  const taxTotal = sessionData?.taxTotal ?? +((sub - discount) * 0.07).toFixed(2);
  const total = sessionData?.total ?? +(sub - discount + shippingCost + taxTotal).toFixed(2);

  const validatePromo = async () => {
    try {
      const res = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, subtotal: sub }),
      });
      const data = await res.json();
      if (data.valid) setDiscount(data.discount);
    } catch {}
  };

  const handleContinueToPayment = async () => {
    const valid = await trigger();
    if (!valid) return;

    setLoading(true);
    setError(null);

    try {
      const vals = getValues();

      const sessionRes = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal: sub,
          state: vals.state,
          shippingMethod: vals.shippingMethod,
          discountAmount: discount,
        }),
      });
      const session = await sessionRes.json();
      setSessionData(session);

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            price: i.price,
            name: i.name,
          })),
          shipping: {
            email: vals.email,
            firstName: vals.firstName,
            lastName: vals.lastName,
            address1: vals.address1,
            address2: vals.address2,
            city: vals.city,
            state: vals.state,
            zip: vals.zip,
            country: vals.country,
            phone: vals.phone,
          },
          shippingMethod: vals.shippingMethod,
          discountCode: promoCode || undefined,
        }),
      });
      const checkoutData = await checkoutRes.json();

      if (checkoutData.error) {
        setError(checkoutData.error);
        return;
      }

      if (checkoutData.mode === "stub") {
        clearCart();
        window.location.href = `/checkout/success?order_id=${checkoutData.orderId}`;
        return;
      }

      if (checkoutData.clientSecret) {
        setClientSecret(checkoutData.clientSecret);
        setStep("payment");
        analytics.checkoutStepCompleted("shipping");
      }
    } catch {
      setError("Failed to process. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!paymentFormRef.current || !clientSecret) {
        setError("Payment system unavailable");
        return;
      }

      const { error: stripeError } = await paymentFormRef.current.confirmPayment(
        `${window.location.origin}/checkout/success`
      );

      if (stripeError) {
        setError(stripeError.message ?? "Payment failed");
      }
    } catch {
      setError("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onPaymentReady = useCallback(() => {
    setPaymentReady(true);
  }, []);

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <h1 className="font-display text-3xl text-white mb-4">Your cart is empty</h1>
        <Link href="/products" className="text-primary hover:text-primary/80 text-sm font-medium">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <nav className="flex items-center gap-1.5 text-xs text-white/40 mb-8">
        <Link href="/" className="hover:text-primary transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/cart" className="hover:text-primary transition-colors">Cart</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-white/60">Checkout</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10">
        <div>
          <h1 className="font-display text-3xl text-white mb-8">Checkout</h1>

          <MobileSummaryToggle items={items} total={total} />

          <div className={step !== "shipping" ? "opacity-50 pointer-events-none" : ""}>
            {savedAddresses.length > 0 && (
              <div className="mb-6">
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Saved Addresses</label>
                <select
                  onChange={(e) => handleSelectSavedAddress(e.target.value)}
                  defaultValue=""
                  className={inputClasses + " cursor-pointer"}
                >
                  <option value="" disabled className="bg-[#0D0D0D] text-white/50">Select a saved address...</option>
                  {savedAddresses.map((addr) => (
                    <option key={addr.id} value={addr.id} className="bg-[#0D0D0D] text-white">
                      {addr.firstName} {addr.lastName} — {addr.address1}, {addr.city}, {addr.state} {addr.zip}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <ShippingForm register={register} errors={errors} subtotal={sub} />

            <button
              onClick={handleContinueToPayment}
              disabled={loading}
              className="w-full mt-6 bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-lg font-semibold uppercase tracking-wider text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue to Payment
            </button>
          </div>

          {step === "payment" && (
            <div className="mt-10 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-white">Payment</h2>
                <button onClick={() => setStep("shipping")} className="text-xs text-primary hover:text-primary/80">
                  Edit Shipping
                </button>
              </div>

              <PaymentForm ref={paymentFormRef} clientSecret={clientSecret} onReady={onPaymentReady} />

              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={billingSameAsShipping}
                    onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                    className="text-primary focus:ring-primary rounded"
                  />
                  <span className="text-sm text-white/70">Billing address same as shipping</span>
                </label>

                {!billingSameAsShipping && (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <h3 className="text-sm font-semibold text-white/80">Billing Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">First Name</label>
                        <input
                          type="text"
                          value={billingAddress.firstName}
                          onChange={(e) => setBillingAddress((p) => ({ ...p, firstName: e.target.value }))}
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">Last Name</label>
                        <input
                          type="text"
                          value={billingAddress.lastName}
                          onChange={(e) => setBillingAddress((p) => ({ ...p, lastName: e.target.value }))}
                          className={inputClasses}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">Address</label>
                        <input
                          type="text"
                          value={billingAddress.address1}
                          onChange={(e) => setBillingAddress((p) => ({ ...p, address1: e.target.value }))}
                          className={inputClasses}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">Apartment, suite, etc.</label>
                        <input
                          type="text"
                          value={billingAddress.address2}
                          onChange={(e) => setBillingAddress((p) => ({ ...p, address2: e.target.value }))}
                          className={inputClasses}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-white/50 mb-1.5 block">City</label>
                        <input
                          type="text"
                          value={billingAddress.city}
                          onChange={(e) => setBillingAddress((p) => ({ ...p, city: e.target.value }))}
                          className={inputClasses}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-white/50 mb-1.5 block">State</label>
                          <input
                            type="text"
                            value={billingAddress.state}
                            onChange={(e) => setBillingAddress((p) => ({ ...p, state: e.target.value }))}
                            className={inputClasses}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-white/50 mb-1.5 block">ZIP</label>
                          <input
                            type="text"
                            value={billingAddress.zip}
                            onChange={(e) => setBillingAddress((p) => ({ ...p, zip: e.target.value }))}
                            className={inputClasses}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={loading || (!paymentReady && !!clientSecret)}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-lg font-semibold uppercase tracking-wider text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Place Order &middot; {formatPrice(total)}
              </button>
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          <OrderSummary
            items={items}
            subtotal={sub}
            shippingCost={shippingCost}
            taxTotal={taxTotal}
            discount={discount}
            total={total}
            promoCode={promoCode}
            onPromoChange={setPromoCode}
            onApplyPromo={validatePromo}
          />
        </div>
      </div>
    </div>
  );
}
