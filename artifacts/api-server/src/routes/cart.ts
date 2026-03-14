import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, cartItemsTable, productsTable, productImagesTable } from "@workspace/db";
import { AddToCartBody, UpdateCartItemBody, RemoveFromCartQueryParams, GetCartQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/cart", async (req, res): Promise<void> => {
  const parsed = GetCartQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { sessionId } = parsed.data;
  if (!sessionId) { res.json([]); return; }

  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
  const productIds = items.map(i => i.productId);
  if (productIds.length === 0) { res.json([]); return; }

  const products = await db.select().from(productsTable).where(sql`${productsTable.id} IN ${productIds}`);
  const images = await db.select().from(productImagesTable).where(sql`${productImagesTable.productId} IN ${productIds}`).orderBy(productImagesTable.sortOrder);

  const productMap = new Map(products.map(p => [p.id, p]));
  const imageMap = new Map<string, string>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
  }

  res.json(items.map(item => {
    const product = productMap.get(item.productId);
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      product: {
        name: product?.name ?? "",
        slug: product?.slug ?? "",
        price: product?.price ?? "0",
        imageUrl: imageMap.get(item.productId) ?? null,
      },
    };
  }));
});

router.post("/cart", async (req, res): Promise<void> => {
  const parsed = AddToCartBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { productId, variantId, quantity = 1, sessionId } = parsed.data;

  const existingConditions = [eq(cartItemsTable.sessionId, sessionId!), eq(cartItemsTable.productId, productId)];
  if (variantId) {
    existingConditions.push(eq(cartItemsTable.variantId, variantId));
  }
  const existing = sessionId ? await db.select().from(cartItemsTable).where(and(...existingConditions)) : [];
  if (existing.length > 0) {
    const [updated] = await db.update(cartItemsTable).set({ quantity: existing[0].quantity + quantity }).where(eq(cartItemsTable.id, existing[0].id)).returning();
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    res.status(201).json({ id: updated.id, productId, variantId: updated.variantId, quantity: updated.quantity, product: { name: product?.name ?? "", slug: product?.slug ?? "", price: product?.price ?? "0", imageUrl: null } });
    return;
  }

  const [item] = await db.insert(cartItemsTable).values({ productId, variantId, quantity, sessionId }).returning();
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  res.status(201).json({ id: item.id, productId, variantId: item.variantId, quantity: item.quantity, product: { name: product?.name ?? "", slug: product?.slug ?? "", price: product?.price ?? "0", imageUrl: null } });
});

router.put("/cart", async (req, res): Promise<void> => {
  const parsed = UpdateCartItemBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { itemId, quantity } = parsed.data;

  if (quantity <= 0) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
    res.sendStatus(204);
    return;
  }

  const [item] = await db.update(cartItemsTable).set({ quantity }).where(eq(cartItemsTable.id, itemId)).returning();
  if (!item) { res.status(404).json({ error: "Cart item not found" }); return; }
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
  res.json({ id: item.id, productId: item.productId, variantId: item.variantId, quantity: item.quantity, product: { name: product?.name ?? "", slug: product?.slug ?? "", price: product?.price ?? "0", imageUrl: null } });
});

router.delete("/cart", async (req, res): Promise<void> => {
  const parsed = RemoveFromCartQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  await db.delete(cartItemsTable).where(eq(cartItemsTable.id, parsed.data.itemId));
  res.sendStatus(204);
});

export default router;
