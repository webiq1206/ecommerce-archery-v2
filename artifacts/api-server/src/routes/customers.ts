import { Router, type IRouter } from "express";
import { eq, sql, ilike, desc, and, or, type SQL } from "drizzle-orm";
import { db, usersTable, ordersTable } from "@workspace/db";
import { ListCustomersQueryParams, GetCustomerParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/customers", async (req, res): Promise<void> => {
  const parsed = ListCustomersQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { page = 1, limit = 20, search } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(usersTable.role, "CUSTOMER")];
  if (search) {
    const searchCondition = or(ilike(usersTable.email, `%${search}%`), ilike(usersTable.name, `%${search}%`));
    if (searchCondition) conditions.push(searchCondition);
  }
  const where = and(...conditions);

  const [users, countResult] = await Promise.all([
    db.select().from(usersTable).where(where).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(usersTable).where(where),
  ]);
  const total = countResult[0]?.count ?? 0;

  const userIds = users.map(u => u.id);
  const orderStats = userIds.length > 0 ? await db.select({ userId: ordersTable.userId, count: sql<number>`count(*)::int`, total: sql<string>`coalesce(sum(${ordersTable.total}::numeric), 0)::text` }).from(ordersTable).where(sql`${ordersTable.userId} IN ${userIds}`).groupBy(ordersTable.userId) : [];
  const statsMap = new Map(orderStats.map(s => [s.userId, s]));

  res.json({
    customers: users.map(u => {
      const stats = statsMap.get(u.id);
      return {
        id: u.id, email: u.email, name: u.name, phone: u.phone, role: u.role,
        createdAt: u.createdAt.toISOString(),
        orderCount: stats?.count ?? 0,
        totalSpent: stats?.total ?? "0",
      };
    }),
    total, page, limit, totalPages: Math.ceil(total / limit),
  });
});

router.get("/customers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, raw));
  if (!user) { res.status(404).json({ error: "Customer not found" }); return; }

  const [stats] = await db.select({ count: sql<number>`count(*)::int`, total: sql<string>`coalesce(sum(${ordersTable.total}::numeric), 0)::text` }).from(ordersTable).where(eq(ordersTable.userId, user.id));

  res.json({
    id: user.id, email: user.email, name: user.name, phone: user.phone, role: user.role,
    createdAt: user.createdAt.toISOString(),
    orderCount: stats?.count ?? 0,
    totalSpent: stats?.total ?? "0",
  });
});

export default router;
