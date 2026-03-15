import type { Metadata } from "next";
import Link from "next/link";
import { db, ordersTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { format } from "date-fns";

export const metadata: Metadata = { title: "Admin Orders" };

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-orange-100 text-orange-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default async function AdminOrdersPage() {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(50);

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8">Orders</h1>
      {orders.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-lg">No orders yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Order #</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Total</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-muted/20">
                  <td className="px-6 py-4 font-mono text-sm">
                    <Link href={`/admin/orders/${order.id}`} className="text-primary hover:underline">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.customerName}</div>
                    <div className="text-sm text-muted-foreground">{order.customerEmail}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status] ?? "bg-gray-100"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">${order.total}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {format(new Date(order.createdAt), "MMM d, yyyy")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
