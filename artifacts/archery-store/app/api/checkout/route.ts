import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, productsTable, productVariantsTable } from "@workspace/db";
import { CheckoutSessionBody } from "@workspace/api-zod";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = CheckoutSessionBody.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const { items, customerEmail } = parsed.data;

  let totalAmount = 0;
  const resolvedItems = [];

  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(and(eq(productsTable.id, item.productId), eq(productsTable.status, "ACTIVE")));
    if (!product) return NextResponse.json({ error: `Product ${item.productId} not found or unavailable` }, { status: 400 });

    let price = Number(product.price);

    if (item.variantId) {
      const [variant] = await db.select().from(productVariantsTable).where(and(eq(productVariantsTable.id, item.variantId), eq(productVariantsTable.productId, product.id)));
      if (!variant) return NextResponse.json({ error: `Variant ${item.variantId} not found` }, { status: 400 });
      price = variant.price ? Number(variant.price) : price;
    }

    totalAmount += Math.round(price * 100) * item.quantity;
    resolvedItems.push({ productId: item.productId, variantId: item.variantId, quantity: item.quantity, unitPrice: price });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return NextResponse.json({
      sessionId: `stub_session_${Date.now()}`,
      clientSecret: `stub_secret_${Date.now()}`,
      mode: "stub",
      message: "Stripe not configured — returning stub session.",
      amount: totalAmount, items: resolvedItems, customerEmail,
    });
  }

  try {
    const stripe = await import("stripe");
    const client = new stripe.default(stripeKey);
    const paymentIntent = await client.paymentIntents.create({
      amount: totalAmount, currency: "usd", receipt_email: customerEmail,
      metadata: { itemCount: String(items.length) },
    });
    return NextResponse.json({
      sessionId: paymentIntent.id, clientSecret: paymentIntent.client_secret,
      mode: "live", amount: paymentIntent.amount, currency: paymentIntent.currency,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create payment intent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
