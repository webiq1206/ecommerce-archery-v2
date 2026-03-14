import type { Metadata } from "next";
import { DollarSign, ShoppingCart, TrendingUp, Package } from "lucide-react";
import { db, ordersTable, productVariantsTable } from "@workspace/db";
import { sql, eq, lte } from "drizzle-orm";

export const metadata: Metadata = { title: "Admin Dashboard" };

async function getDashboardData() {
  const [revenueResult, orderCount, lowStockCount] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(${ordersTable.total}::numeric), 0)::text` }).from(ordersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(ordersTable),
    db.select({ count: sql<number>`count(*)::int` }).from(productVariantsTable).where(lte(productVariantsTable.inventory, 5)),
  ]);
  const totalRevenue = revenueResult[0]?.total ?? "0";
  const totalOrders = orderCount[0]?.count ?? 0;
  const avgOrderValue = totalOrders > 0 ? (Number(totalRevenue) / totalOrders).toFixed(2) : "0.00";
  const lowStock = lowStockCount[0]?.count ?? 0;
  return { totalRevenue: Number(totalRevenue).toFixed(2), totalOrders, avgOrderValue, lowStock };
}

export default async function AdminDashboard() {
  const data = await getDashboardData();

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Revenue" value={`$${data.totalRevenue}`} icon={<DollarSign className="w-5 h-5" />} color="bg-primary/10 text-primary" />
        <StatCard title="Total Orders" value={String(data.totalOrders)} icon={<ShoppingCart className="w-5 h-5" />} color="bg-blue-500/10 text-blue-600" />
        <StatCard title="Avg Order Value" value={`$${data.avgOrderValue}`} icon={<TrendingUp className="w-5 h-5" />} color="bg-purple-500/10 text-purple-600" />
        <StatCard title="Low Stock Alerts" value={String(data.lowStock)} icon={<Package className="w-5 h-5" />} color="bg-red-500/10 text-red-600" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border p-6 min-h-[300px]">
        <h3 className="font-normal text-lg mb-6">Revenue Over Time</h3>
        <div className="flex items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-xl">
          Chart integration placeholder
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-border">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <h3 className="text-2xl font-normal font-display">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
      </div>
    </div>
  );
}
