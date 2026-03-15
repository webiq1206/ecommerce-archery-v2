import { NextRequest, NextResponse } from "next/server";
import { eq, sql, desc, and, type SQL } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, productVariantsTable } from "@/lib/db";
import { CreateOrderBody } from "@/lib/api-zod";

function generateOrderNumber(): string {
  const prefix = "ORD";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = Number(sp.get("page")) || 1;
  const limit = Number(sp.get("limit")) || 20;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];
  const status = sp.get("status");
  if (status) conditions.push(eq(ordersTable.status, status as "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" | "PARTIALLY_REFUNDED"));
  const customerId = sp.get("customerId");
  if (customerId) conditions.push(eq(ordersTable.userId, customerId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [orders, countResult] = await Promise.all([
    db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(where),
  ]);

  return NextResponse.json({
    orders: orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
    total: countResult[0]?.count ?? 0, page, limit,
  });
}

export async function POST(request: NextRequest) {
  const raw = await request.json();
  const parsed = CreateOrderBody.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const data = parsed.data;
  const { items, customerEmail, customerName, customerPhone, shippingAddress, billingAddress, shippingMethod, discountCode } = data;

  let subtotal = 0;
  const itemSnapshots = [];

  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 400 });

    let price = product.price;
    let sku = product.sku;
    let name = product.name;

    if (item.variantId) {
      const [variant] = await db.select().from(productVariantsTable).where(and(eq(productVariantsTable.id, item.variantId), eq(productVariantsTable.productId, product.id)));
      if (!variant) return NextResponse.json({ error: `Variant ${item.variantId} not found` }, { status: 400 });
      price = variant.price ?? product.price;
      sku = variant.sku;
      name = `${product.name} - ${variant.name}`;
    }

    subtotal += Number(price) * item.quantity;
    itemSnapshots.push({ productId: item.productId, variantId: item.variantId ?? null, name, sku, price, quantity: item.quantity });
  }

  const [order] = await db.insert(ordersTable).values({
    orderNumber: generateOrderNumber(), customerEmail, customerName, customerPhone,
    shippingAddress: shippingAddress as Record<string, string>, billingAddress: billingAddress as Record<string, string>,
    shippingMethod, discountCode,
    subtotal: String(subtotal), total: String(subtotal),
  }).returning();

  await db.insert(orderItemsTable).values(itemSnapshots.map((item) => ({ ...item, orderId: order.id })));

  return NextResponse.json({ ...order, createdAt: order.createdAt.toISOString() }, { status: 201 });
}
