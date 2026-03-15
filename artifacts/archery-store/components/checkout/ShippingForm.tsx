"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import type { CheckoutFormData } from "./checkout-schema";

interface ShippingFormProps {
  register: UseFormRegister<CheckoutFormData>;
  errors: FieldErrors<CheckoutFormData>;
  subtotal: number;
}

const inputClasses = "w-full bg-white/5 border border-white/10 text-white px-4 py-3 rounded-lg text-sm focus:outline-none focus:border-primary";

export function ShippingForm({ register, errors, subtotal }: ShippingFormProps) {
  return (
    <div className="space-y-6">
      <h2 className="font-display text-xl text-white">Contact & Shipping</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-white/50 mb-1.5 block">Email *</label>
          <input type="email" {...register("email")} className={inputClasses} />
          {errors.email && <p className="text-xs text-destructive mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-white/50 mb-1.5 block">First Name *</label>
          <input type="text" {...register("firstName")} className={inputClasses} />
          {errors.firstName && <p className="text-xs text-destructive mt-1">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-white/50 mb-1.5 block">Last Name *</label>
          <input type="text" {...register("lastName")} className={inputClasses} />
          {errors.lastName && <p className="text-xs text-destructive mt-1">{errors.lastName.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-white/50 mb-1.5 block">Address *</label>
          <input type="text" {...register("address1")} className={inputClasses} />
          {errors.address1 && <p className="text-xs text-destructive mt-1">{errors.address1.message}</p>}
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-white/50 mb-1.5 block">Apartment, suite, etc. (optional)</label>
          <input type="text" {...register("address2")} className={inputClasses} />
        </div>
        <div>
          <label className="text-xs font-medium text-white/50 mb-1.5 block">City *</label>
          <input type="text" {...register("city")} className={inputClasses} />
          {errors.city && <p className="text-xs text-destructive mt-1">{errors.city.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-white/50 mb-1.5 block">State *</label>
            <input type="text" {...register("state")} className={inputClasses} />
            {errors.state && <p className="text-xs text-destructive mt-1">{errors.state.message}</p>}
          </div>
          <div>
            <label className="text-xs font-medium text-white/50 mb-1.5 block">ZIP *</label>
            <input type="text" {...register("zip")} className={inputClasses} />
            {errors.zip && <p className="text-xs text-destructive mt-1">{errors.zip.message}</p>}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-white/50 mb-1.5 block">Phone (optional)</label>
          <input type="tel" {...register("phone")} className={inputClasses} />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-white/50 mb-3 block">Shipping Method</label>
        <div className="space-y-2">
          {[
            { value: "standard" as const, label: "Standard Shipping", price: subtotal >= 99 ? "Free" : "$7.99", time: "5-7 business days" },
            { value: "express" as const, label: "Express Shipping", price: "$14.99", time: "2-3 business days" },
          ].map((method) => (
            <label key={method.value} className="flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-white/20 cursor-pointer transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
              <div className="flex items-center gap-3">
                <input type="radio" value={method.value} {...register("shippingMethod")} className="text-primary focus:ring-primary" />
                <div>
                  <span className="text-sm font-medium text-white">{method.label}</span>
                  <span className="text-xs text-white/40 ml-2">{method.time}</span>
                </div>
              </div>
              <span className="text-sm font-medium text-white">{method.price}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
