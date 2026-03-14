import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, wishlistItemsTable, productsTable, productImagesTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/wishlist", async (req, res): Promise<void> => {
  const userId = req.query.userId as string | undefined;
  if (!userId) {
    res.status(400).json({ error: "userId is required" });
    return;
  }

  const items = await db.select().from(wishlistItemsTable).where(eq(wishlistItemsTable.userId, userId));
  const productIds = items.map(i => i.productId);
  if (productIds.length === 0) {
    res.json([]);
    return;
  }

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
      addedAt: item.addedAt.toISOString(),
      product: product ? {
        name: product.name,
        slug: product.slug,
        price: product.price,
        imageUrl: imageMap.get(item.productId) ?? null,
      } : null,
    };
  }));
});

router.post("/wishlist", async (req, res): Promise<void> => {
  const { userId, productId } = req.body;
  if (!userId || !productId) {
    res.status(400).json({ error: "userId and productId are required" });
    return;
  }

  const existing = await db.select().from(wishlistItemsTable).where(
    and(eq(wishlistItemsTable.userId, userId), eq(wishlistItemsTable.productId, productId))
  );
  if (existing.length > 0) {
    res.status(200).json({ success: true, id: existing[0].id });
    return;
  }

  const [item] = await db.insert(wishlistItemsTable).values({ userId, productId }).returning();
  res.status(201).json({ success: true, id: item.id });
});

router.delete("/wishlist/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(wishlistItemsTable).where(eq(wishlistItemsTable.id, raw));
  res.sendStatus(204);
});

export default router;
