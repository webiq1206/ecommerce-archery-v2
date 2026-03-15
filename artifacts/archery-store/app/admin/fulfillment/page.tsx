import type { Metadata } from "next";
import { db, fulfillmentLogsTable, productsTable, distributorsTable, ordersTable, categoriesTable, storeSettingsTable } from "@workspace/db";
import { desc, eq, sql, and, isNull } from "drizzle-orm";
import { format } from "date-fns";
import { FulfillmentClient } from "./FulfillmentClient";

export const metadata: Metadata = { title: "Admin Fulfillment" };

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  EMAIL_SENT: "bg-blue-100 text-blue-800",
  CONFIRMED: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  DELIVERED: "bg-orange-100 text-orange-800",
  FAILED: "bg-red-100 text-red-800",
};

export default async function AdminFulfillmentPage() {
  const [logs, distributors, unassignedProducts, pendingOrders, categories, rulesSetting] = await Promise.all([
    db.select().from(fulfillmentLogsTable).orderBy(desc(fulfillmentLogsTable.createdAt)).limit(50),
    db.select({ id: distributorsTable.id, name: distributorsTable.name, email: distributorsTable.email }).from(distributorsTable).orderBy(distributorsTable.name),
    db.select({ id: productsTable.id, name: productsTable.name, sku: productsTable.sku })
      .from(productsTable)
      .where(and(eq(productsTable.status, "ACTIVE"), isNull(productsTable.distributorId)))
      .limit(50),
    db.select({
      id: ordersTable.id,
      orderNumber: ordersTable.orderNumber,
      status: ordersTable.status,
      fulfillmentStatus: ordersTable.fulfillmentStatus,
      createdAt: ordersTable.createdAt,
    })
      .from(ordersTable)
      .where(eq(ordersTable.fulfillmentStatus, "PENDING"))
      .orderBy(desc(ordersTable.createdAt))
      .limit(20),
    db.select({ id: categoriesTable.id, name: categoriesTable.name }).from(categoriesTable).where(eq(categoriesTable.isActive, true)).orderBy(categoriesTable.name),
    db.select().from(storeSettingsTable).where(eq(storeSettingsTable.key, "fulfillment_routing_rules")).limit(1),
  ]);

  let routingRules: Array<{ id: string; categoryId: string; distributorId: string }> = [];
  try {
    if (rulesSetting[0]) {
      routingRules = JSON.parse(rulesSetting[0].value);
    }
  } catch { /* ignore parse errors */ }

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8 text-gray-900">Fulfillment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Pending Fulfillment</h3>
          <p className="text-3xl font-bold text-gray-900">{logs.filter((l) => l.status === "PENDING").length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Unassigned Products</h3>
          <p className="text-3xl font-bold text-gray-900">{unassignedProducts.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Active Distributors</h3>
          <p className="text-3xl font-bold text-gray-900">{distributors.length}</p>
        </div>
      </div>

      <FulfillmentClient
        distributors={distributors}
        unassignedProducts={unassignedProducts}
        pendingOrders={pendingOrders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))}
        categories={categories}
        initialRoutingRules={routingRules}
      />

      {/* Fulfillment Logs */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Fulfillment Logs</h2>
        {logs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <p className="text-gray-500 text-lg">No fulfillment logs yet</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Order</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Distributor</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Email Sent</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-mono text-sm text-gray-900">{log.orderId.slice(0, 8)}...</td>
                    <td className="px-6 py-4 text-gray-700">{log.distributorId.slice(0, 8)}...</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[log.status] ?? "bg-gray-100"}`}>{log.status}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{log.emailSentAt ? format(new Date(log.emailSentAt), "MMM d, HH:mm") : "—"}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{format(new Date(log.createdAt), "MMM d, yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
