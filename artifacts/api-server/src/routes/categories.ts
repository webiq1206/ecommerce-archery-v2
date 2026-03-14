import { Router, type IRouter } from "express";
import { eq, sql, and, isNull, asc, type SQL } from "drizzle-orm";
import { db, categoriesTable, productCategoriesTable } from "@workspace/db";
import {
  ListCategoriesQueryParams,
  CreateCategoryBody,
  UpdateCategoryBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", async (req, res): Promise<void> => {
  const parsed = ListCategoriesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { parentId, active } = parsed.data;
  const conditions: SQL[] = [];
  if (parentId !== undefined) {
    if (parentId === null || parentId === "null") {
      conditions.push(isNull(categoriesTable.parentId));
    } else {
      conditions.push(eq(categoriesTable.parentId, parentId as string));
    }
  }
  if (active !== undefined) {
    conditions.push(eq(categoriesTable.isActive, active));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const categories = await db.select().from(categoriesTable).where(where).orderBy(asc(categoriesTable.sortOrder));

  const counts = await db.select({ categoryId: productCategoriesTable.categoryId, count: sql<number>`count(*)::int` }).from(productCategoriesTable).groupBy(productCategoriesTable.categoryId);
  const countMap = new Map(counts.map(c => [c.categoryId, c.count]));

  const childMap = new Map<string, Array<{ id: string; name: string; slug: string }>>();
  for (const cat of categories) {
    if (cat.parentId) {
      if (!childMap.has(cat.parentId)) childMap.set(cat.parentId, []);
      childMap.get(cat.parentId)!.push({ id: cat.id, name: cat.name, slug: cat.slug });
    }
  }

  res.json(categories.map(c => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    imageUrl: c.imageUrl,
    parentId: c.parentId,
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    productCount: countMap.get(c.id) ?? 0,
    children: childMap.get(c.id) ?? [],
  })));
});

router.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [category] = await db.insert(categoriesTable).values({
    name: data.name,
    slug: data.slug,
    description: data.description,
    imageUrl: data.imageUrl,
    imageAlt: data.imageAlt,
    parentId: data.parentId,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
    seoTitle: data.seoTitle,
    seoDesc: data.seoDesc,
  }).returning();
  res.status(201).json(category);
});

router.get("/categories/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, raw));
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(category);
});

router.put("/categories/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [category] = await db.update(categoriesTable).set({
    name: data.name,
    slug: data.slug,
    description: data.description,
    imageUrl: data.imageUrl,
    imageAlt: data.imageAlt,
    parentId: data.parentId,
    sortOrder: data.sortOrder,
    isActive: data.isActive,
    seoTitle: data.seoTitle,
    seoDesc: data.seoDesc,
  }).where(eq(categoriesTable.id, raw)).returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.json(category);
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [category] = await db.delete(categoriesTable).where(eq(categoriesTable.id, raw)).returning();
  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
