import type { Metadata } from "next";
import {
  db,
  distributorsTable,
  fulfillmentLogsTable,
  ordersTable,
  orderItemsTable,
} from "@/lib/db";
import { sql, desc, inArray } from "drizzle-orm";
import { DistributorReportClient } from "./DistributorReportClient";

export const metadata: Metadata = { title: "Distributor Reports" };

async function getDistributorReports() {
  const distributors = await db.select().from(distributorsTable).orderBy(desc(distributorsTable.createdAt));

  const fulfillmentLogs = await db.select().from(fulfillmentLogsTable);
  const orderIdsByDistributor = new Map<string, Set<string>>();
  const pendingByDistributor = new Map<string, number>();

  for (const fl of fulfillmentLogs) {
    if (!orderIdsByDistributor.has(fl.distributorId)) {
      orderIdsByDistributor.set(fl.distributorId, new Set());
    }
    orderIdsByDistributor.get(fl.distributorId)!.add(fl.orderId);
    if (fl.status === "PENDING") {
      pendingByDistributor.set(fl.distributorId, (pendingByDistributor.get(fl.distributorId) ?? 0) + 1);
    }
  }

  const result: Array<{
    id: string;
    name: string;
    isActive: boolean;
    orderCount: number;
    itemCount: number;
    totalGmv: number;
    pendingOrders: number;
  }> = [];

  for (const d of distributors) {
    const orderIds = Array.from(orderIdsByDistributor.get(d.id) ?? []);
    const orderCount = orderIds.length;
    const pendingOrders = pendingByDistributor.get(d.id) ?? 0;

    let itemCount = 0;
    let totalGmv = 0;

    if (orderIds.length > 0) {
      const [itemsResult, gmvResult] = await Promise.all([
        db
          .select({ total: sql<number>`COALESCE(SUM(${orderItemsTable.quantity}), 0)::int` })
          .from(orderItemsTable)
          .where(inArray(orderItemsTable.orderId, orderIds)),
        db
          .select({ total: sql<string>`COALESCE(SUM(${ordersTable.total}::numeric), 0)::text` })
          .from(ordersTable)
          .where(inArray(ordersTable.id, orderIds)),
      ]);
      itemCount = itemsResult[0]?.total ?? 0;
      totalGmv = Number(gmvResult[0]?.total ?? 0);
    }

    result.push({
      id: d.id,
      name: d.name,
      isActive: d.isActive,
      orderCount,
      itemCount,
      totalGmv,
      pendingOrders,
    });
  }

  return result;
}

export default async function DistributorReportsPage() {
  const reports = await getDistributorReports();

  return <DistributorReportClient reports={reports} />;
}
