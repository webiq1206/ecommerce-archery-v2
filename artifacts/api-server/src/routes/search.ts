import { Router, type IRouter } from "express";
import { sql, and, eq, asc, desc, gte, lte } from "drizzle-orm";
import { db, productsTable, productImagesTable, brandsTable, reviewsTable } from "@workspace/db";
import { SearchProductsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/search", async (req, res): Promise<void> => {
  const parsed = SearchProductsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { q, page = 1, limit = 24, category, brand, minPrice, maxPrice, sort = "relevance" } = parsed.data;
  const offset = (page - 1) * limit;

  const tsQuery = q.split(/\s+/).filter(Boolean).map(w => `${w}:*`).join(" & ");

  const conditions: any[] = [
    eq(productsTable.status, "ACTIVE"),
    sql`(
      ${productsTable.name} ILIKE ${'%' + q + '%'}
      OR ${productsTable.shortDescription} ILIKE ${'%' + q + '%'}
      OR ${productsTable.sku} ILIKE ${'%' + q + '%'}
    )`,
  ];

  if (brand) {
    const [b] = await db.select({ id: brandsTable.id }).from(brandsTable).where(eq(brandsTable.slug, brand)).limit(1);
    if (b) conditions.push(eq(productsTable.brandId, b.id));
  }
  if (minPrice !== undefined) conditions.push(gte(productsTable.price, String(minPrice)));
  if (maxPrice !== undefined) conditions.push(lte(productsTable.price, String(maxPrice)));

  const where = and(...conditions);

  let orderBy: any = desc(productsTable.createdAt);
  if (sort === "price_asc") orderBy = asc(productsTable.price);
  else if (sort === "price_desc") orderBy = desc(productsTable.price);
  else if (sort === "newest") orderBy = desc(productsTable.createdAt);

  const [products, countResult] = await Promise.all([
    db.select().from(productsTable).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(where),
  ]);
  const total = countResult[0]?.count ?? 0;

  const productIds = products.map(p => p.id);
  const images = productIds.length > 0 ? await db.select().from(productImagesTable).where(sql`${productImagesTable.productId} IN ${productIds}`).orderBy(asc(productImagesTable.sortOrder)) : [];
  const brandIds = [...new Set(products.map(p => p.brandId).filter(Boolean))] as string[];
  const brands = brandIds.length > 0 ? await db.select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug }).from(brandsTable).where(sql`${brandsTable.id} IN ${brandIds}`) : [];
  const reviewCounts = productIds.length > 0 ? await db.select({ productId: reviewsTable.productId, count: sql<number>`count(*)::int` }).from(reviewsTable).where(and(sql`${reviewsTable.productId} IN ${productIds}`, eq(reviewsTable.isApproved, true))).groupBy(reviewsTable.productId) : [];

  const imageMap = new Map<string, any[]>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, []);
    imageMap.get(img.productId)!.push({ id: img.id, url: img.url, altText: img.altText, sortOrder: img.sortOrder });
  }
  const brandMap = new Map(brands.map(b => [b.id, b]));
  const reviewMap = new Map(reviewCounts.map(r => [r.productId, r.count]));

  res.json({
    products: products.map(p => ({
      id: p.id, name: p.name, slug: p.slug, sku: p.sku, status: p.status,
      shortDescription: p.shortDescription, price: p.price, compareAtPrice: p.compareAtPrice,
      isFeatured: p.isFeatured, isNewArrival: p.isNewArrival, createdAt: p.createdAt.toISOString(),
      images: imageMap.get(p.id) ?? [],
      brand: p.brandId ? brandMap.get(p.brandId) ?? null : null,
      reviewCount: reviewMap.get(p.id) ?? 0,
    })),
    total, page, limit, totalPages: Math.ceil(total / limit),
  });
});

export default router;
