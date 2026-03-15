import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db, ordersTable, orderItemsTable } from "@/lib/db";
import { eq } from "drizzle-orm";
import { ArrowLeft, Package, MapPin, CreditCard, Truck } from "lucide-react";
import { OrderDetailClient } from "./OrderDetailClient";
import { auth } from "@/lib/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const { id } = await params;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, id));
  if (!order) notFound();

  const isOwner =
    order.userId === session.user.id ||
    (session.user.email && order.customerEmail === session.user.email);
  if (!isOwner) notFound();

  const items = await db
    .select()
    .from(orderItemsTable)
    .where(eq(orderItemsTable.orderId, order.id));

  const shippingAddress = order.shippingAddress as Record<string, string> | null;
  const billingAddress = order.billingAddress as Record<string, string> | null;

  const formatAddress = (addr: Record<string, string> | null) => {
    if (!addr) return null;
    const parts = [
      addr.line1,
      addr.line2,
      [addr.city, addr.state, addr.zip].filter(Boolean).join(", "),
      addr.country,
    ].filter(Boolean);
    return parts.join(", ");
  };

  return (
    <div>
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to orders
      </Link>

      <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wider mb-2">
        Order {order.orderNumber}
      </h1>
      <p className="text-white/60 mb-8">
        Placed on {new Date(order.createdAt).toLocaleDateString()}
      </p>

      <div className="space-y-6">
        {/* Items */}
        <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
            <Package className="w-4 h-4 text-primary" />
            <h2 className="font-display text-sm uppercase tracking-wider">Items</h2>
          </div>
          <div className="divide-y divide-white/5">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-sm text-white/50">
                    {item.quantity} × ${Number(item.price).toFixed(2)}
                  </p>
                </div>
                <span className="font-medium text-white">
                  ${(Number(item.price) * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Addresses & totals row */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
              <MapPin className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm uppercase tracking-wider">Addresses</h2>
            </div>
            <div className="p-5 space-y-4">
              {shippingAddress && (
                <div>
                  <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">Shipping</p>
                  <p className="text-sm text-white/80">{formatAddress(shippingAddress)}</p>
                </div>
              )}
              {billingAddress && (
                <div>
                  <p className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1">Billing</p>
                  <p className="text-sm text-white/80">{formatAddress(billingAddress)}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
              <CreditCard className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm uppercase tracking-wider">Totals & Payment</h2>
            </div>
            <div className="p-5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Subtotal</span>
                <span className="text-white">${Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.shippingTotal) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Shipping</span>
                  <span className="text-white">${Number(order.shippingTotal).toFixed(2)}</span>
                </div>
              )}
              {Number(order.taxTotal) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Tax</span>
                  <span className="text-white">${Number(order.taxTotal).toFixed(2)}</span>
                </div>
              )}
              {Number(order.discountTotal) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Discount</span>
                  <span className="text-emerald-400">-${Number(order.discountTotal).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-white/5 font-medium">
                <span className="text-white">Total</span>
                <span className="text-white">${Number(order.total).toFixed(2)}</span>
              </div>
              <p className="text-xs text-white/40 pt-1">Paid with card ••••</p>
            </div>
          </div>
        </div>

        {/* Tracking */}
        {(order.trackingNumber || order.trackingUrl) && (
          <div className="rounded-xl border border-white/5 bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-white/5">
              <Truck className="w-4 h-4 text-primary" />
              <h2 className="font-display text-sm uppercase tracking-wider">Tracking</h2>
            </div>
            <div className="p-5">
              {order.trackingNumber && (
                <p className="text-sm text-white/70 mb-2">Tracking number: {order.trackingNumber}</p>
              )}
              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm font-medium"
                >
                  Track shipment
                </a>
              )}
            </div>
          </div>
        )}

        {/* Request Return - client component for button */}
        <OrderDetailClient orderId={order.id} status={order.status} />
      </div>
    </div>
  );
}
