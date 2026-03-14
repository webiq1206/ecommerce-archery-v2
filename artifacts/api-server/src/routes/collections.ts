import { Router, type IRouter } from "express";
import { eq, sql, asc } from "drizzle-orm";
import { db, collectionsTable, productCollectionsTable } from "@workspace/db";
import { CreateCollectionBody, UpdateCollectionBody, DeleteCollectionParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/collections", async (_req, res): Promise<void> => {
  const collections = await db.select().from(collectionsTable).orderBy(asc(collectionsTable.sortOrder));
  const counts = await db.select({ collectionId: productCollectionsTable.collectionId, count: sql<number>`count(*)::int` }).from(productCollectionsTable).groupBy(productCollectionsTable.collectionId);
  const countMap = new Map(counts.map(c => [c.collectionId, c.count]));

  res.json(collections.map(c => ({
    id: c.id, name: c.name, slug: c.slug, description: c.description,
    imageUrl: c.imageUrl, isActive: c.isActive, sortOrder: c.sortOrder,
    productCount: countMap.get(c.id) ?? 0,
  })));
});

router.post("/collections", async (req, res): Promise<void> => {
  const parsed = CreateCollectionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [collection] = await db.insert(collectionsTable).values(parsed.data as any).returning();
  res.status(201).json(collection);
});

router.get("/collections/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [collection] = await db.select().from(collectionsTable).where(eq(collectionsTable.id, raw));
  if (!collection) { res.status(404).json({ error: "Collection not found" }); return; }
  res.json(collection);
});

router.put("/collections/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateCollectionBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [collection] = await db.update(collectionsTable).set(parsed.data as any).where(eq(collectionsTable.id, raw)).returning();
  if (!collection) { res.status(404).json({ error: "Collection not found" }); return; }
  res.json(collection);
});

router.delete("/collections/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [collection] = await db.delete(collectionsTable).where(eq(collectionsTable.id, raw)).returning();
  if (!collection) { res.status(404).json({ error: "Collection not found" }); return; }
  res.sendStatus(204);
});

export default router;
