import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, ordersTable, orderItemsTable } from "@workspace/db";
import { UpdateOrderBody } from "@workspace/api-zod";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));

  return NextResponse.json({
    ...order, createdAt: order.createdAt.toISOString(), updatedAt: order.updatedAt.toISOString(),
    items: items.map((i) => ({ id: i.id, name: i.name, sku: i.sku, price: i.price, quantity: i.quantity })),
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const raw = await request.json();
  const parsed = UpdateOrderBody.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const data = parsed.data;
  const [order] = await db.update(ordersTable).set({
    status: data.status as "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED" | "PARTIALLY_REFUNDED" | undefined,
    trackingNumber: data.trackingNumber, trackingUrl: data.trackingUrl, notes: data.notes,
  }).where(eq(ordersTable.id, id)).returning();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ ...order, createdAt: order.createdAt.toISOString() });
}
