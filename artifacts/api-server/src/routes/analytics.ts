import { Router, type IRouter } from "express";
import { sql, gte, desc, eq } from "drizzle-orm";
import { db, ordersTable, productsTable, usersTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/analytics/overview", async (_req, res): Promise<void> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [orderStats] = await db.select({
    totalOrders: sql<number>`count(*)::int`,
    totalRevenue: sql<string>`coalesce(sum(${ordersTable.total}::numeric), 0)::text`,
  }).from(ordersTable).where(gte(ordersTable.createdAt, thirtyDaysAgo));

  const [productStats] = await db.select({
    totalProducts: sql<number>`count(*)::int`,
    activeProducts: sql<number>`count(*) filter (where ${productsTable.status} = 'ACTIVE')::int`,
  }).from(productsTable);

  const [customerStats] = await db.select({
    totalCustomers: sql<number>`count(*)::int`,
  }).from(usersTable).where(eq(usersTable.role, "CUSTOMER"));

  res.json({
    period: "30d",
    orders: { total: orderStats.totalOrders, revenue: orderStats.totalRevenue },
    products: { total: productStats.totalProducts, active: productStats.activeProducts },
    customers: { total: customerStats.totalCustomers },
  });
});

router.get("/analytics/traffic", async (_req, res): Promise<void> => {
  res.status(501).json({ error: "Traffic analytics pending — requires analytics integration" });
});

export default router;
