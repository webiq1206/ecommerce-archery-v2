import Link from "next/link";
import { redirect } from "next/navigation";
import { db, ordersTable, orderItemsTable } from "@workspace/db";
import { eq, desc, sql, or } from "drizzle-orm";
import { auth } from "@/lib/auth";

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-amber-500/20 text-amber-400",
    CONFIRMED: "bg-blue-500/20 text-blue-400",
    PROCESSING: "bg-blue-500/20 text-blue-400",
    SHIPPED: "bg-emerald-500/20 text-emerald-400",
    DELIVERED: "bg-emerald-500/20 text-emerald-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    REFUNDED: "bg-gray-500/20 text-gray-400",
    PARTIALLY_REFUNDED: "bg-gray-500/20 text-gray-400",
  };
  const cls = styles[status] ?? "bg-white/10 text-white/70";
  return (
    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${cls}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export default async function OrderHistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/signin");

  const conditions = [eq(ordersTable.userId, session.user.id)];
  if (session.user.email) {
    conditions.push(eq(ordersTable.customerEmail, session.user.email));
  }

  const orders = await db
    .select()
    .from(ordersTable)
    .where(conditions.length > 1 ? or(...conditions) : conditions[0])
    .orderBy(desc(ordersTable.createdAt));

  const itemCounts = await Promise.all(
    orders.map(async (o) => {
      const [r] = await db
        .select({ count: sql<number>`COALESCE(SUM(${orderItemsTable.quantity}), 0)::int` })
        .from(orderItemsTable)
        .where(eq(orderItemsTable.orderId, o.id));
      return r?.count ?? 0;
    })
  );

  return (
    <div>
      <h1 className="font-display text-2xl md:text-3xl uppercase tracking-wider mb-8">Order History</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl bg-card border border-white/5 p-12 text-center">
          <p className="text-white/60 mb-4">You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="text-primary hover:underline font-medium">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-card/50">
                  <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Order</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Status</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-white/60">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, i) => (
                  <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-mono text-sm text-white">{order.orderNumber}</td>
                    <td className="py-4 px-4 text-sm text-white/70">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4 text-sm text-white/70">{itemCounts[i]}</td>
                    <td className="py-4 px-4 text-sm font-medium text-white">${Number(order.total).toFixed(2)}</td>
                    <td className="py-4 px-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="text-primary hover:underline text-sm font-medium"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
