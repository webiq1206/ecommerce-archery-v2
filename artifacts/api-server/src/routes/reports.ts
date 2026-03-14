import { Router, type IRouter } from "express";
import { sql, gte, lte, and, desc, eq, type SQL } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, usersTable, productVariantsTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/reports/revenue", async (req, res): Promise<void> => {
  const { startDate, endDate } = req.query;
  const conditions: SQL[] = [];
  if (startDate) conditions.push(gte(ordersTable.createdAt, new Date(startDate as string)));
  if (endDate) conditions.push(lte(ordersTable.createdAt, new Date(endDate as string)));
  conditions.push(eq(ordersTable.paymentStatus, "PAID"));
  const where = and(...conditions);

  const [totals] = await db.select({
    totalRevenue: sql<string>`coalesce(sum(${ordersTable.total}::numeric), 0)::text`,
    totalOrders: sql<number>`count(*)::int`,
  }).from(ordersTable).where(where);

  const avgOrderValue = totals.totalOrders > 0 ? (Number(totals.totalRevenue) / totals.totalOrders).toFixed(2) : "0";

  const periodData = await db.select({
    date: sql<string>`to_char(${ordersTable.createdAt}, 'YYYY-MM-DD')`,
    revenue: sql<string>`coalesce(sum(${ordersTable.total}::numeric), 0)::text`,
    orders: sql<number>`count(*)::int`,
  }).from(ordersTable).where(where).groupBy(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM-DD')`).orderBy(sql`to_char(${ordersTable.createdAt}, 'YYYY-MM-DD')`);

  res.json({
    totalRevenue: totals.totalRevenue ?? "0",
    totalOrders: totals.totalOrders ?? 0,
    averageOrderValue: avgOrderValue,
    periodData,
  });
});

router.get("/reports/products", async (_req, res): Promise<void> => {
  const topProducts = await db.select({
    productId: orderItemsTable.productId,
    name: orderItemsTable.name,
    totalSold: sql<number>`sum(${orderItemsTable.quantity})::int`,
    revenue: sql<string>`sum(${orderItemsTable.price}::numeric * ${orderItemsTable.quantity})::text`,
  }).from(orderItemsTable).groupBy(orderItemsTable.productId, orderItemsTable.name).orderBy(desc(sql`sum(${orderItemsTable.quantity})`)).limit(10);

  const lowStockProducts = await db.select({
    productId: productVariantsTable.productId,
    name: productVariantsTable.name,
    totalInventory: sql<number>`sum(${productVariantsTable.inventory})::int`,
  }).from(productVariantsTable).groupBy(productVariantsTable.productId, productVariantsTable.name).orderBy(sql`sum(${productVariantsTable.inventory})`).limit(10);

  res.json({ topProducts, lowStockProducts });
});

router.get("/reports/customers", async (_req, res): Promise<void> => {
  const [totalResult] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "CUSTOMER"));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [newResult] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(and(eq(usersTable.role, "CUSTOMER"), gte(usersTable.createdAt, thirtyDaysAgo)));

  const topCustomers = await db.select({
    id: usersTable.id,
    name: usersTable.name,
    email: usersTable.email,
    orderCount: sql<number>`count(${ordersTable.id})::int`,
    totalSpent: sql<string>`coalesce(sum(${ordersTable.total}::numeric), 0)::text`,
  }).from(usersTable).leftJoin(ordersTable, eq(usersTable.id, ordersTable.userId)).where(eq(usersTable.role, "CUSTOMER")).groupBy(usersTable.id).orderBy(desc(sql`sum(${ordersTable.total}::numeric)`)).limit(10);

  res.json({
    totalCustomers: totalResult?.count ?? 0,
    newCustomersThisMonth: newResult?.count ?? 0,
    topCustomers,
  });
});

export default router;
