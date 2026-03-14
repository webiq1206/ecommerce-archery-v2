import { Router, type IRouter } from "express";
import { eq, sql, asc } from "drizzle-orm";
import { db, brandsTable, productsTable } from "@workspace/db";
import { CreateBrandBody, UpdateBrandBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/brands", async (_req, res): Promise<void> => {
  const brands = await db.select().from(brandsTable).orderBy(asc(brandsTable.name));
  const counts = await db.select({
    brandId: productsTable.brandId,
    count: sql<number>`count(*)::int`,
  }).from(productsTable).where(sql`${productsTable.brandId} IS NOT NULL`).groupBy(productsTable.brandId);
  const countMap = new Map(counts.map(c => [c.brandId, c.count]));

  res.json(brands.map(b => ({
    id: b.id, name: b.name, slug: b.slug, description: b.description,
    logoUrl: b.logoUrl, bannerUrl: b.bannerUrl, website: b.website,
    isActive: b.isActive, productCount: countMap.get(b.id) ?? 0,
  })));
});

router.post("/brands", async (req, res): Promise<void> => {
  const parsed = CreateBrandBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [brand] = await db.insert(brandsTable).values({
    name: data.name,
    slug: data.slug,
    description: data.description,
    logoUrl: data.logoUrl,
    bannerUrl: data.bannerUrl,
    website: data.website,
    isActive: data.isActive,
    seoTitle: data.seoTitle,
    seoDesc: data.seoDesc,
  }).returning();
  res.status(201).json(brand);
});

router.get("/brands/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [brand] = await db.select().from(brandsTable).where(eq(brandsTable.id, raw));
  if (!brand) {
    res.status(404).json({ error: "Brand not found" });
    return;
  }
  res.json(brand);
});

router.put("/brands/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateBrandBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [brand] = await db.update(brandsTable).set({
    name: data.name,
    slug: data.slug,
    description: data.description,
    logoUrl: data.logoUrl,
    bannerUrl: data.bannerUrl,
    website: data.website,
    isActive: data.isActive,
    seoTitle: data.seoTitle,
    seoDesc: data.seoDesc,
  }).where(eq(brandsTable.id, raw)).returning();
  if (!brand) {
    res.status(404).json({ error: "Brand not found" });
    return;
  }
  res.json(brand);
});

router.delete("/brands/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [brand] = await db.delete(brandsTable).where(eq(brandsTable.id, raw)).returning();
  if (!brand) {
    res.status(404).json({ error: "Brand not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
