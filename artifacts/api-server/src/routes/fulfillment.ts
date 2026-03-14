import { Router, type IRouter } from "express";
import { eq, sql, desc, and, type SQL } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, distributorsTable, fulfillmentLogsTable } from "@workspace/db";
import { TriggerFulfillmentBody, ListFulfillmentLogsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/fulfillment", async (req, res): Promise<void> => {
  const parsed = TriggerFulfillmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, parsed.data.orderId));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));
  const productIds = items.map(i => i.productId);
  const products = productIds.length > 0 ? await db.select().from(productsTable).where(sql`${productsTable.id} IN ${productIds}`) : [];
  const productMap = new Map(products.map(p => [p.id, p]));

  type OrderItem = typeof items[number];
  type ProductRow = typeof products[number];
  const distributorMap = new Map<string, { distributor: { id: string; email: string; ccEmails: string[] | null }; items: OrderItem[] }>();
  const unassignedItems: OrderItem[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product?.distributorId) {
      unassignedItems.push(item);
      continue;
    }
    if (!distributorMap.has(product.distributorId)) {
      const [dist] = await db.select().from(distributorsTable).where(eq(distributorsTable.id, product.distributorId));
      distributorMap.set(product.distributorId, { distributor: dist, items: [] });
    }
    distributorMap.get(product.distributorId)!.items.push(item);
  }

  const logs = [];
  for (const [distributorId, { distributor, items: distItems }] of distributorMap) {
    const [log] = await db.insert(fulfillmentLogsTable).values({
      orderId: order.id,
      distributorId,
      status: "PENDING",
      itemsSent: distItems.map(i => ({ productId: i.productId, variantId: i.variantId, sku: i.sku, qty: i.quantity, name: i.name })),
      emailRecipients: [distributor.email, ...(distributor.ccEmails ?? [])],
    }).returning();
    logs.push({ ...log, createdAt: log.createdAt.toISOString() });
  }

  res.json({ success: true, logs, unassignedItems });
});

router.get("/fulfillment/logs", async (req, res): Promise<void> => {
  const parsed = ListFulfillmentLogsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { orderId, distributorId, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];
  if (orderId) conditions.push(eq(fulfillmentLogsTable.orderId, orderId));
  if (distributorId) conditions.push(eq(fulfillmentLogsTable.distributorId, distributorId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [logs, countResult] = await Promise.all([
    db.select().from(fulfillmentLogsTable).where(where).orderBy(desc(fulfillmentLogsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(fulfillmentLogsTable).where(where),
  ]);
  const total = countResult[0]?.count ?? 0;

  res.json({
    logs: logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString(), emailSentAt: l.emailSentAt?.toISOString() ?? null })),
    total, page, limit, totalPages: Math.ceil(total / limit),
  });
});

export default router;
