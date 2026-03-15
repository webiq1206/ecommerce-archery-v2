import { NextRequest, NextResponse } from "next/server";
import { db, ordersTable, orderItemsTable, cartItemsTable, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

function generateOrderNumber() {
  const prefix = "APX";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentMethodId, shipping } = body;

    if (!paymentMethodId) {
      return NextResponse.json({ error: "Missing payment method" }, { status: 400 });
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const sessionId = request.cookies.get("apex_session_id")?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "No cart session" }, { status: 400 });
    }

    const cartItems = await db
      .select()
      .from(cartItemsTable)
      .where(eq(cartItemsTable.sessionId, sessionId));

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const productIds = cartItems.map((c) => c.productId);
    const products = await db
      .select()
      .from(productsTable)
      .where(sql`${productsTable.id} IN ${productIds}`);

    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const resolvedItems = cartItems.map((ci) => {
      const product = productMap.get(ci.productId);
      const price = Number(product?.price ?? ci.price ?? 0);
      subtotal += price * ci.quantity;
      return {
        productId: ci.productId,
        variantId: ci.variantId,
        name: product?.name ?? "Product",
        sku: product?.sku ?? "",
        price,
        quantity: ci.quantity,
      };
    });

    const shippingCost = subtotal >= 99 ? 0 : 7.99;
    const taxTotal = +(subtotal * 0.07).toFixed(2);
    const total = +(subtotal + shippingCost + taxTotal).toFixed(2);

    const stripe = await import("stripe");
    const client = new stripe.default(stripeKey);

    const pi = await client.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: { itemCount: String(cartItems.length) },
    });

    if (pi.status !== "succeeded") {
      return NextResponse.json({ error: "Payment failed" }, { status: 400 });
    }

    const shippingName = shipping?.name || shipping?.recipient || "Customer";
    const shippingAddr = shipping?.addressLine?.[0] || "";

    const [order] = await db.insert(ordersTable).values({
      orderNumber: generateOrderNumber(),
      status: "CONFIRMED",
      paymentStatus: "PAID",
      customerEmail: "",
      customerName: shippingName,
      shippingAddress: {
        firstName: shippingName,
        lastName: "",
        address1: shippingAddr,
        address2: shipping?.addressLine?.[1] || "",
        city: shipping?.city || "",
        state: shipping?.region || "",
        zip: shipping?.postalCode || "",
        country: shipping?.country || "US",
      },
      subtotal: subtotal.toFixed(2),
      shippingTotal: shippingCost.toFixed(2),
      taxTotal: taxTotal.toFixed(2),
      total: total.toFixed(2),
      shippingMethod: "standard",
      stripePaymentIntentId: pi.id,
    }).returning();

    await db.insert(orderItemsTable).values(
      resolvedItems.map((item) => ({
        orderId: order.id,
        productId: item.productId,
        variantId: item.variantId || null,
        name: item.name,
        sku: item.sku,
        price: item.price.toFixed(2),
        quantity: item.quantity,
      }))
    );

    await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));

    return NextResponse.json({ orderId: order.id, orderNumber: order.orderNumber });
  } catch (err) {
    console.error("Express checkout error:", err);
    return NextResponse.json({ error: "Express checkout failed" }, { status: 500 });
  }
}
