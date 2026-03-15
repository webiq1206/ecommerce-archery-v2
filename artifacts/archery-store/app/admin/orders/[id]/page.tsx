import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db, ordersTable, orderItemsTable, fulfillmentLogsTable, distributorsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { format } from "date-fns";
import { OrderDetailClient } from "./OrderDetailClient";

export const metadata: Metadata = { title: "Order Detail" };

async function getOrder(id: string) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) return null;

  const [items, fulfillmentLogs] = await Promise.all([
    db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id)),
    db.select().from(fulfillmentLogsTable).where(eq(fulfillmentLogsTable.orderId, order.id)),
  ]);

  const distIds = [...new Set(fulfillmentLogs.map((f) => f.distributorId))];
  const distributors =
    distIds.length > 0
      ? await db.select({ id: distributorsTable.id, name: distributorsTable.name }).from(distributorsTable).where(sql`${distributorsTable.id} IN ${distIds}`)
      : [];

  const distMap = new Map(distributors.map((d) => [d.id, d.name]));

  return {
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    shippedAt: order.shippedAt?.toISOString() ?? null,
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      sku: i.sku,
      price: i.price,
      quantity: i.quantity,
      options: i.options as Record<string, string> | null,
    })),
    fulfillment: fulfillmentLogs.map((f) => ({
      id: f.id,
      distributorId: f.distributorId,
      distributorName: distMap.get(f.distributorId) ?? "",
      status: f.status,
      notes: f.notes,
    })),
  };
}

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const shippingAddr = order.shippingAddress as Record<string, unknown> | null;
  const billingAddr = order.billingAddress as Record<string, unknown> | null;

  function normalizeAddress(addr: Record<string, unknown> | null) {
    if (!addr) return null;
    return {
      line1: (addr.address1 || addr.line1 || "") as string,
      line2: (addr.address2 || addr.line2 || "") as string,
      city: (addr.city || "") as string,
      state: (addr.state || "") as string,
      zip: (addr.zip || addr.postalCode || "") as string,
      country: (addr.country || "") as string,
    };
  }

  const shippingAddress = normalizeAddress(shippingAddr);
  const billingAddress = normalizeAddress(billingAddr);

  return (
    <div className="space-y-8 bg-white text-gray-900">
      <div className="flex items-center justify-between">
        <Link href="/admin/orders" className="text-sm text-gray-600 hover:text-gray-900">
          ← Back to Orders
        </Link>
      </div>

      <h1 className="text-2xl font-semibold text-gray-900">
        Order {order.orderNumber}
        <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${
          order.status === "SHIPPED" || order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
          order.status === "CANCELLED" || order.status === "REFUNDED" ? "bg-red-100 text-red-700" :
          "bg-yellow-100 text-yellow-800"
        }`}>
          {order.status}
        </span>
      </h1>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Line Items</h2>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-500 font-mono">{item.sku}</p>
                    {item.options && Object.keys(item.options).length > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        {Object.entries(item.options).map(([k, v]) => `${k}: ${v}`).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-gray-900">${item.price} × {item.quantity}</p>
                    <p className="font-medium">${(parseFloat(String(item.price)) * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Customer</h2>
            <p className="font-medium text-gray-900">{order.customerName}</p>
            <p className="text-gray-600">{order.customerEmail}</p>
            {order.customerPhone && <p className="text-gray-600">{order.customerPhone}</p>}
          </div>

          <div className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
            {shippingAddress && (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {[
                  shippingAddress.line1,
                  shippingAddress.line2,
                  [shippingAddress.city, shippingAddress.state, shippingAddress.zip].filter(Boolean).join(", "),
                  shippingAddress.country,
                ].filter(Boolean).join("\n")}
              </pre>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h2>
            {billingAddr ? (
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">
                {billingAddress && [
                  billingAddress.line1,
                  billingAddress.line2,
                  [billingAddress.city, billingAddress.state, billingAddress.zip].filter(Boolean).join(", "),
                  billingAddress.country,
                ].filter(Boolean).join("\n")}
              </pre>
            ) : (
              <p className="text-gray-500 text-sm">Same as shipping</p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Payment</h2>
            <p className="text-sm text-gray-600">Total: ${order.total}</p>
            {order.stripeChargeId && (
              <p className="text-xs font-mono text-gray-500 mt-1">Charge ID: {order.stripeChargeId}</p>
            )}
          </div>

          <OrderDetailClient
            orderId={order.id}
            status={order.status}
            trackingNumber={order.trackingNumber}
            fulfillment={order.fulfillment}
            total={order.total}
          />
        </div>
      </div>
    </div>
  );
}
