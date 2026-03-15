import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db, productsTable, productVariantsTable, ordersTable, orderItemsTable } from "@workspace/db";

interface CheckoutItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number;
  name: string;
}

interface ShippingAddress {
  email: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

function generateOrderNumber() {
  const prefix = "APX";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, shipping, shippingMethod, discountCode } = body as {
      items: CheckoutItem[];
      shipping: ShippingAddress;
      shippingMethod: string;
      discountCode?: string;
    };

    if (!items?.length || !shipping?.email || !shipping?.firstName || !shipping?.lastName) {
      return NextResponse.json({ error: "Missing required checkout data" }, { status: 400 });
    }

    let subtotal = 0;
    const resolvedItems: Array<{ productId: string; variantId?: string | null; name: string; sku: string; price: number; quantity: number }> = [];

    for (const item of items) {
      const [product] = await db.select().from(productsTable).where(and(eq(productsTable.id, item.productId), eq(productsTable.status, "ACTIVE")));
      if (!product) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });

      let price = Number(product.price);
      let sku = product.sku;

      if (item.variantId) {
        const [variant] = await db.select().from(productVariantsTable).where(and(eq(productVariantsTable.id, item.variantId), eq(productVariantsTable.productId, product.id)));
        if (variant) {
          price = variant.price ? Number(variant.price) : price;
          sku = variant.sku;
        }
      }

      subtotal += price * item.quantity;
      resolvedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name || product.name,
        sku,
        price,
        quantity: item.quantity,
      });
    }

    const shippingCost = shippingMethod === "express" ? 14.99 : subtotal >= 99 ? 0 : 7.99;
    const taxRate = 0.07;
    const taxTotal = +((subtotal) * taxRate).toFixed(2);
    const total = +(subtotal + shippingCost + taxTotal).toFixed(2);

    const stripeKey = process.env.STRIPE_SECRET_KEY;
    let stripePaymentIntentId: string | null = null;
    let clientSecret: string | null = null;

    if (stripeKey) {
      const stripe = await import("stripe");
      const client = new stripe.default(stripeKey);
      const pi = await client.paymentIntents.create({
        amount: Math.round(total * 100),
        currency: "usd",
        receipt_email: shipping.email,
        metadata: { itemCount: String(items.length) },
      });
      stripePaymentIntentId = pi.id;
      clientSecret = pi.client_secret;
    }

    const [order] = await db.insert(ordersTable).values({
      orderNumber: generateOrderNumber(),
      status: "PENDING",
      paymentStatus: stripeKey ? "UNPAID" : "UNPAID",
      customerEmail: shipping.email,
      customerName: `${shipping.firstName} ${shipping.lastName}`,
      customerPhone: shipping.phone || null,
      shippingAddress: {
        firstName: shipping.firstName,
        lastName: shipping.lastName,
        address1: shipping.address1,
        address2: shipping.address2 || "",
        city: shipping.city,
        state: shipping.state,
        zip: shipping.zip,
        country: shipping.country,
      },
      subtotal: subtotal.toFixed(2),
      shippingTotal: shippingCost.toFixed(2),
      taxTotal: taxTotal.toFixed(2),
      total: total.toFixed(2),
      shippingMethod,
      discountCode: discountCode || null,
      stripePaymentIntentId,
      ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || null,
      userAgent: request.headers.get("user-agent") || null,
    }).returning();

    if (resolvedItems.length > 0) {
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
    }

    if (!stripeKey) {
      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.orderNumber,
        mode: "stub",
        total,
      });
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientSecret,
      mode: "live",
      total,
    });
  } catch (err) {
    console.error("Checkout error:", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
