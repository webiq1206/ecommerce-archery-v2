import type { Metadata } from "next";
import Link from "next/link";
import { DollarSign, ShoppingCart, TrendingUp, Package, AlertTriangle } from "lucide-react";
import { db, ordersTable, productsTable, productVariantsTable, usersTable, fulfillmentLogsTable, orderItemsTable } from "@workspace/db";
import { sql, eq, lte, desc, and, gte } from "drizzle-orm";
import { RevenueChart } from "./RevenueChart";

export const metadata: Metadata = { title: "Admin Dashboard" };

async function getDashboardData() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    revenueResult,
    todayRevenue,
    yesterdayRevenue,
    orderCount,
    todayOrders,
    yesterdayOrders,
    activeProducts,
    yesterdayActiveProducts,
    totalCustomers,
    newCustomersToday,
    lowStockItems,
    recentOrders,
    pendingFulfillment,
    last30DaysRevenue,
    topProductsThisWeek,
  ] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(${ordersTable.total}::numeric), 0)::text` }).from(ordersTable),
    db.select({ total: sql<string>`COALESCE(SUM(${ordersTable.total}::numeric), 0)::text` }).from(ordersTable).where(gte(ordersTable.createdAt, today)),
    db.select({ total: sql<string>`COALESCE(SUM(${ordersTable.total}::numeric), 0)::text` }).from(ordersTable).where(and(gte(ordersTable.createdAt, yesterday), sql`${ordersTable.createdAt} < ${today}`)),
    db.select({ count: sql<number>`count(*)::int` }).from(ordersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(gte(ordersTable.createdAt, today)),
    db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(and(gte(ordersTable.createdAt, yesterday), sql`${ordersTable.createdAt} < ${today}`)),
    db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(eq(productsTable.status, "ACTIVE")),
    db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(
      and(eq(productsTable.status, "ACTIVE"), sql`${productsTable.createdAt} < ${today}`)
    ),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(gte(usersTable.createdAt, yesterday)),
    db.select({ id: productVariantsTable.id, name: productVariantsTable.name, sku: productVariantsTable.sku, inventory: productVariantsTable.inventory }).from(productVariantsTable).where(lte(productVariantsTable.inventory, 5)).limit(10),
    db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(10),
    db.select({ count: sql<number>`count(*)::int` }).from(fulfillmentLogsTable).where(eq(fulfillmentLogsTable.status, "PENDING")),
    db.select({
      date: sql<string>`to_char(${ordersTable.createdAt}, 'YYYY-MM-DD')`,
      revenue: sql<string>`COALESCE(SUM(${ordersTable.total}::numeric), 0)::text`,
    })
      .from(ordersTable)
      .where(gte(ordersTable.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
      .groupBy(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM-DD')`),
    db.select({
      productName: orderItemsTable.name,
      unitsSold: sql<number>`SUM(${orderItemsTable.quantity})::int`,
      revenue: sql<string>`COALESCE(SUM(${orderItemsTable.price}::numeric * ${orderItemsTable.quantity}), 0)::text`,
    })
      .from(orderItemsTable)
      .innerJoin(ordersTable, eq(orderItemsTable.orderId, ordersTable.id))
      .where(gte(ordersTable.createdAt, sevenDaysAgo))
      .groupBy(orderItemsTable.productId, orderItemsTable.name)
      .orderBy(sql`SUM(${orderItemsTable.price}::numeric * ${orderItemsTable.quantity}) DESC`)
      .limit(5),
  ]);

  const currentActive = activeProducts[0]?.count ?? 0;
  const prevActive = yesterdayActiveProducts[0]?.count ?? 0;

  return {
    todayRevenue: Number(todayRevenue[0]?.total ?? 0).toFixed(2),
    yesterdayRevenue: Number(yesterdayRevenue[0]?.total ?? 0).toFixed(2),
    todayOrders: todayOrders[0]?.count ?? 0,
    yesterdayOrders: yesterdayOrders[0]?.count ?? 0,
    activeProducts: currentActive,
    activeProductsDelta: currentActive - prevActive,
    totalCustomers: totalCustomers[0]?.count ?? 0,
    newCustomers: newCustomersToday[0]?.count ?? 0,
    lowStockItems,
    recentOrders,
    pendingFulfillment: pendingFulfillment[0]?.count ?? 0,
    chartData: last30DaysRevenue.map((d) => ({ date: d.date, revenue: Number(d.revenue) })),
    topProducts: topProductsThisWeek.map((p) => ({
      name: p.productName,
      unitsSold: p.unitsSold,
      revenue: Number(p.revenue).toFixed(2),
    })),
  };
}

export default async function AdminDashboard() {
  const data = await getDashboardData();
  const revDelta = Number(data.todayRevenue) - Number(data.yesterdayRevenue);
  const orderDelta = data.todayOrders - data.yesterdayOrders;

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8 text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Today's Revenue"
          value={`$${data.todayRevenue}`}
          delta={revDelta}
          icon={<DollarSign className="w-5 h-5" />}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          title="Orders Today"
          value={String(data.todayOrders)}
          delta={orderDelta}
          icon={<ShoppingCart className="w-5 h-5" />}
          color="bg-blue-500/10 text-blue-600"
        />
        <StatCard
          title="Active Products"
          value={String(data.activeProducts)}
          delta={data.activeProductsDelta}
          icon={<Package className="w-5 h-5" />}
          color="bg-purple-500/10 text-purple-600"
        />
        <StatCard
          title="Total Customers"
          value={String(data.totalCustomers)}
          delta={data.newCustomers}
          deltaLabel="new since yesterday"
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-green-500/10 text-green-600"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Revenue (Last 30 Days)</h3>
        <RevenueChart data={data.chartData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
            <Link href="/admin/orders" className="text-sm text-primary hover:text-primary/80">View all</Link>
          </div>
          <div className="space-y-3">
            {data.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between py-2 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div>
                  <span className="text-sm font-medium text-gray-900">{order.orderNumber}</span>
                  <span className="text-xs text-gray-500 ml-2">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    order.status === "CONFIRMED" ? "bg-green-100 text-green-700" :
                    order.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                    order.status === "SHIPPED" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-700"
                  }`}>
                    {order.status}
                  </span>
                  <span className="text-sm text-gray-900">${Number(order.total).toFixed(2)}</span>
                </div>
              </Link>
            ))}
            {data.recentOrders.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">No orders yet</p>
            )}
          </div>
        </div>

        {/* Top 5 Products This Week */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top 5 Products This Week</h3>
          {data.topProducts.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_80px_100px] gap-2 text-xs font-medium text-gray-400 uppercase tracking-wider pb-2 border-b border-gray-100">
                <span>Product</span>
                <span className="text-right">Units</span>
                <span className="text-right">Revenue</span>
              </div>
              {data.topProducts.map((product, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_80px_100px] gap-2 items-center py-2"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-gray-400 w-5 shrink-0">{i + 1}</span>
                    <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
                  </div>
                  <span className="text-sm text-gray-600 text-right">{product.unitsSold}</span>
                  <span className="text-sm font-medium text-gray-900 text-right">${product.revenue}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">No sales this week</p>
          )}
        </div>

        {/* Alerts */}
        <div className="space-y-6">
          {data.pendingFulfillment > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h3 className="text-lg font-medium text-yellow-800">Pending Fulfillment</h3>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                {data.pendingFulfillment} order{data.pendingFulfillment > 1 ? "s" : ""} awaiting fulfillment
              </p>
              <Link href="/admin/fulfillment" className="text-sm text-yellow-800 font-medium hover:underline">
                View Fulfillment Queue →
              </Link>
            </div>
          )}

          {data.lowStockItems.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <Package className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-medium text-red-800">Low Stock Alerts</h3>
              </div>
              <div className="space-y-2">
                {data.lowStockItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-red-700">{item.name} ({item.sku})</span>
                    <span className="font-medium text-red-800">{item.inventory} left</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, delta, deltaLabel, icon, color }: { title: string; value: string; delta?: number; deltaLabel?: string; icon: React.ReactNode; color: string }) {
  const label = deltaLabel ?? "vs yesterday";
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-normal font-display text-gray-900">{value}</h3>
          {delta !== undefined && (
            <p className={`text-xs mt-1 ${delta >= 0 ? "text-green-600" : "text-red-600"}`}>
              {delta >= 0 ? "+" : ""}{typeof delta === "number" && delta % 1 !== 0 ? `$${delta.toFixed(2)}` : delta} {label}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}
