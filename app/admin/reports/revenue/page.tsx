import type { Metadata } from "next";
import { db, ordersTable, refundsTable } from "@/lib/db";
import { sql, gte, lte, and } from "drizzle-orm";
import { RevenueReportClient } from "./RevenueReportClient";

export const metadata: Metadata = { title: "Revenue Report" };

async function getRevenueData(startDate?: string, endDate?: string) {
  const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const end = endDate ? new Date(endDate + "T23:59:59.999Z") : new Date();

  const dateFilter = and(gte(ordersTable.createdAt, start), lte(ordersTable.createdAt, end));

  const [revenueRow, orderCountRow, refundsRow, chartData] = await Promise.all([
    db.select({ total: sql<string>`COALESCE(SUM(${ordersTable.total}::numeric), 0)::text` }).from(ordersTable).where(dateFilter),
    db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(dateFilter),
    db.select({ total: sql<string>`COALESCE(SUM(${refundsTable.amount}::numeric), 0)::text` }).from(refundsTable)
      .where(and(gte(refundsTable.createdAt, start), lte(refundsTable.createdAt, end))),
    db
      .select({
        date: sql<string>`to_char(${ordersTable.createdAt}, 'YYYY-MM-DD')`,
        revenue: sql<string>`COALESCE(SUM(${ordersTable.total}::numeric), 0)::text`,
      })
      .from(ordersTable)
      .where(dateFilter)
      .groupBy(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM-DD')`),
  ]);

  const totalRevenue = Number(revenueRow[0]?.total ?? 0);
  const orderCount = orderCountRow[0]?.count ?? 0;
  const totalRefunds = Number(refundsRow[0]?.total ?? 0);
  const netRevenue = totalRevenue - totalRefunds;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  return {
    totalRevenue,
    orderCount,
    avgOrderValue,
    totalRefunds,
    netRevenue,
    chartData: chartData.map((d) => ({ date: d.date, revenue: Number(d.revenue) })),
  };
}

export default async function RevenueReportPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const { start, end } = await searchParams;
  const data = await getRevenueData(start, end);

  return (
    <RevenueReportClient
      data={data}
      initialStart={start ?? ""}
      initialEnd={end ?? ""}
    />
  );
}
