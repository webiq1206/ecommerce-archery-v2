import { NextRequest, NextResponse } from "next/server";

const TAX_RATES: Record<string, number> = {
  CA: 0.0725, TX: 0.0625, NY: 0.08, FL: 0.06, WA: 0.065,
  IL: 0.0625, PA: 0.06, OH: 0.0575, GA: 0.04, NC: 0.0475,
};

const DEFAULT_TAX_RATE = 0.07;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subtotal, state, shippingMethod, discountAmount = 0 } = body;

    if (typeof subtotal !== "number" || !state || !shippingMethod) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const shippingCost = shippingMethod === "express"
      ? 14.99
      : subtotal >= 99
        ? 0
        : 7.99;

    const taxableAmount = Math.max(subtotal - discountAmount, 0);
    const taxRate = TAX_RATES[state.toUpperCase()] ?? DEFAULT_TAX_RATE;
    const taxTotal = +(taxableAmount * taxRate).toFixed(2);
    const total = +(taxableAmount + shippingCost + taxTotal).toFixed(2);

    return NextResponse.json({
      shippingCost,
      taxRate,
      taxTotal,
      total,
    });
  } catch {
    return NextResponse.json({ error: "Failed to calculate checkout session" }, { status: 500 });
  }
}
