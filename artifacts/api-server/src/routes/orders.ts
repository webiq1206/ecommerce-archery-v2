import { Router, type IRouter } from "express";
import { eq, sql, desc, and, asc } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, productVariantsTable } from "@workspace/db";
import { ListOrdersQueryParams, CreateOrderBody, GetOrderParams, UpdateOrderBody } from "@workspace/api-zod";

const router: IRouter = Router();

function generateOrderNumber(): string {
  const prefix = "ORD";
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

router.get("/orders", async (req, res): Promise<void> => {
  const parsed = ListOrdersQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { page = 1, limit = 20, status, customerId } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (status) conditions.push(eq(ordersTable.status, status as any));
  if (customerId) conditions.push(eq(ordersTable.userId, customerId));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [orders, countResult] = await Promise.all([
    db.select().from(ordersTable).where(where).orderBy(desc(ordersTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(ordersTable).where(where),
  ]);
  const total = countResult[0]?.count ?? 0;

  res.json({
    orders: orders.map(o => ({ ...o, createdAt: o.createdAt.toISOString() })),
    total, page, limit, totalPages: Math.ceil(total / limit),
  });
});

router.post("/orders", async (req, res): Promise<void> => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { items, ...orderData } = parsed.data;

  let subtotal = 0;
  const itemSnapshots = [];

  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) { res.status(400).json({ error: `Product ${item.productId} not found` }); return; }

    let price = product.price;
    let sku = product.sku;
    let name = product.name;
    let options = null;

    if (item.variantId) {
      const [variant] = await db.select().from(productVariantsTable).where(and(eq(productVariantsTable.id, item.variantId), eq(productVariantsTable.productId, product.id)));
      if (!variant) {
        res.status(400).json({ error: `Variant ${item.variantId} not found for product ${item.productId}` });
        return;
      }
      price = variant.price ?? product.price;
      sku = variant.sku;
      name = `${product.name} - ${variant.name}`;
      options = variant.options;
    }

    subtotal += Number(price) * item.quantity;
    itemSnapshots.push({ productId: item.productId, variantId: item.variantId ?? null, name, sku, price, quantity: item.quantity, options });
  }

  const [order] = await db.insert(ordersTable).values({
    ...orderData as any,
    orderNumber: generateOrderNumber(),
    subtotal: String(subtotal),
    total: String(subtotal),
  }).returning();

  await db.insert(orderItemsTable).values(itemSnapshots.map(item => ({ ...item, orderId: order.id })));

  res.status(201).json({ ...order, createdAt: order.createdAt.toISOString() });
});

router.get("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, raw));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }

  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, order.id));

  res.json({
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: items.map(i => ({ id: i.id, name: i.name, sku: i.sku, price: i.price, quantity: i.quantity, options: i.options })),
  });
});

router.put("/orders/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateOrderBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [order] = await db.update(ordersTable).set(parsed.data as any).where(eq(ordersTable.id, raw)).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json({ ...order, createdAt: order.createdAt.toISOString() });
});

export default router;
