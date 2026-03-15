import type { Metadata } from "next";
import { db, ordersTable } from "@/lib/db";
import { sql, desc } from "drizzle-orm";

export const metadata: Metadata = { title: "Admin Customers" };

async function getCustomers() {
  const customers = await db
    .select({
      email: ordersTable.customerEmail,
      name: ordersTable.customerName,
      orderCount: sql<number>`count(*)::int`,
      totalSpent: sql<string>`COALESCE(SUM(${ordersTable.total}::numeric), 0)::text`,
      latestOrder: sql<string>`MAX(${ordersTable.createdAt})::text`,
    })
    .from(ordersTable)
    .groupBy(ordersTable.customerEmail, ordersTable.customerName)
    .orderBy(desc(sql`MAX(${ordersTable.createdAt})`))
    .limit(50);
  return customers;
}

export default async function AdminCustomersPage() {
  const customers = await getCustomers();

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8">Customers</h1>
      {customers.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center">
          <p className="text-muted-foreground text-lg">No customers yet</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Orders</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.map((customer, i) => (
                <tr key={i} className="hover:bg-muted/20">
                  <td className="px-6 py-4 font-medium">{customer.name ?? "—"}</td>
                  <td className="px-6 py-4 text-sm">{customer.email}</td>
                  <td className="px-6 py-4 text-center">{customer.orderCount}</td>
                  <td className="px-6 py-4 font-medium">${Number(customer.totalSpent).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
