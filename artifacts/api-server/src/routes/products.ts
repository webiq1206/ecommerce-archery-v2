import { Router, type IRouter } from "express";
import { eq, and, ilike, sql, desc, asc, gte, lte, type SQL } from "drizzle-orm";
import { db, productsTable, productImagesTable, productVariantsTable, productSpecsTable, productFaqsTable, productCategoriesTable, productCollectionsTable, categoriesTable, collectionsTable, brandsTable, reviewsTable } from "@workspace/db";
import {
  ListProductsQueryParams,
  CreateProductBody,
  UpdateProductBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/products", async (req, res): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const query = parsed.data;
  const page = query.page ?? 1;
  const limit = query.limit ?? 24;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];
  if (query.status) {
    conditions.push(eq(productsTable.status, query.status as "DRAFT" | "ACTIVE" | "ARCHIVED"));
  } else {
    conditions.push(eq(productsTable.status, "ACTIVE"));
  }
  if (query.featured !== undefined) {
    conditions.push(eq(productsTable.isFeatured, query.featured));
  }
  if (query.search) {
    conditions.push(ilike(productsTable.name, `%${query.search}%`));
  }
  if (query.category) {
    const cat = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, query.category)).limit(1);
    if (cat.length > 0) {
      const catProductIds = await db.select({ productId: productCategoriesTable.productId }).from(productCategoriesTable).where(eq(productCategoriesTable.categoryId, cat[0].id));
      if (catProductIds.length > 0) {
        conditions.push(sql`${productsTable.id} IN ${catProductIds.map(c => c.productId)}`);
      } else {
        conditions.push(sql`false`);
      }
    }
  }
  if (query.collection) {
    const col = await db.select({ id: collectionsTable.id }).from(collectionsTable).where(eq(collectionsTable.slug, query.collection)).limit(1);
    if (col.length > 0) {
      const colProductIds = await db.select({ productId: productCollectionsTable.productId }).from(productCollectionsTable).where(eq(productCollectionsTable.collectionId, col[0].id));
      if (colProductIds.length > 0) {
        conditions.push(sql`${productsTable.id} IN ${colProductIds.map(c => c.productId)}`);
      } else {
        conditions.push(sql`false`);
      }
    }
  }
  if (query.brand) {
    const brand = await db.select({ id: brandsTable.id }).from(brandsTable).where(eq(brandsTable.slug, query.brand)).limit(1);
    if (brand.length > 0) {
      conditions.push(eq(productsTable.brandId, brand[0].id));
    }
  }
  if (query.minPrice !== undefined) {
    conditions.push(gte(productsTable.price, String(query.minPrice)));
  }
  if (query.maxPrice !== undefined) {
    conditions.push(lte(productsTable.price, String(query.maxPrice)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  let orderBy;
  if (query.sort === "price_asc") orderBy = asc(productsTable.price);
  else if (query.sort === "price_desc") orderBy = desc(productsTable.price);
  else if (query.sort === "name_asc") orderBy = asc(productsTable.name);
  else orderBy = desc(productsTable.createdAt);

  const [products, countResult] = await Promise.all([
    db.select().from(productsTable).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;

  const productIds = products.map(p => p.id);
  const images = productIds.length > 0
    ? await db.select().from(productImagesTable).where(sql`${productImagesTable.productId} IN ${productIds}`).orderBy(asc(productImagesTable.sortOrder))
    : [];
  const brandIds = [...new Set(products.map(p => p.brandId).filter((id): id is string => id !== null))];
  const brands = brandIds.length > 0
    ? await db.select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug }).from(brandsTable).where(sql`${brandsTable.id} IN ${brandIds}`)
    : [];
  const reviewCounts = productIds.length > 0
    ? await db.select({
        productId: reviewsTable.productId,
        count: sql<number>`count(*)::int`,
      }).from(reviewsTable)
        .where(and(sql`${reviewsTable.productId} IN ${productIds}`, eq(reviewsTable.isApproved, true)))
        .groupBy(reviewsTable.productId)
    : [];

  const imageMap = new Map<string, Array<{ id: string; url: string; altText: string | null; sortOrder: number }>>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, []);
    imageMap.get(img.productId)!.push({ id: img.id, url: img.url, altText: img.altText, sortOrder: img.sortOrder });
  }
  const brandMap = new Map(brands.map(b => [b.id, b]));
  const reviewMap = new Map(reviewCounts.map(r => [r.productId, r.count]));

  const enriched = products.map(p => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    status: p.status,
    shortDescription: p.shortDescription,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    createdAt: p.createdAt.toISOString(),
    images: imageMap.get(p.id) ?? [],
    brand: p.brandId ? brandMap.get(p.brandId) ?? null : null,
    reviewCount: reviewMap.get(p.id) ?? 0,
  }));

  res.json({ products: enriched, total, page, limit, totalPages: Math.ceil(total / limit) });
});

router.post("/products", async (req, res): Promise<void> => {
  const parsed = CreateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const { categoryIds, collectionIds, ...productData } = data;

  const [product] = await db.insert(productsTable).values({
    name: productData.name,
    slug: productData.slug,
    sku: productData.sku,
    price: productData.price,
    status: productData.status as "DRAFT" | "ACTIVE" | "ARCHIVED" | undefined,
    shortDescription: productData.shortDescription,
    description: productData.description,
    compareAtPrice: productData.compareAtPrice,
    cost: productData.cost,
    weight: productData.weight,
    weightUnit: productData.weightUnit,
    brandId: productData.brandId,
    distributorId: productData.distributorId,
    isFeatured: productData.isFeatured,
    isNewArrival: productData.isNewArrival,
  }).returning();

  if (categoryIds?.length) {
    await db.insert(productCategoriesTable).values(
      categoryIds.map((cid: string, i: number) => ({ productId: product.id, categoryId: cid, isPrimary: i === 0 }))
    );
  }
  if (collectionIds?.length) {
    await db.insert(productCollectionsTable).values(
      collectionIds.map((cid: string) => ({ productId: product.id, collectionId: cid }))
    );
  }

  res.status(201).json(product);
});

router.get("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const [product] = await db.select().from(productsTable).where(
    sql`${productsTable.id} = ${raw} OR ${productsTable.slug} = ${raw}`
  ).limit(1);

  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }

  const [images, variants, specs, faqs, catLinks, reviews] = await Promise.all([
    db.select().from(productImagesTable).where(eq(productImagesTable.productId, product.id)).orderBy(asc(productImagesTable.sortOrder)),
    db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, product.id)).orderBy(asc(productVariantsTable.sortOrder)),
    db.select().from(productSpecsTable).where(eq(productSpecsTable.productId, product.id)).orderBy(asc(productSpecsTable.sortOrder)),
    db.select().from(productFaqsTable).where(eq(productFaqsTable.productId, product.id)).orderBy(asc(productFaqsTable.sortOrder)),
    db.select({ categoryId: productCategoriesTable.categoryId }).from(productCategoriesTable).where(eq(productCategoriesTable.productId, product.id)),
    db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(and(eq(reviewsTable.productId, product.id), eq(reviewsTable.isApproved, true))),
  ]);

  const categoryIds = catLinks.map(c => c.categoryId);
  const categories = categoryIds.length > 0
    ? await db.select({ id: categoriesTable.id, name: categoriesTable.name, slug: categoriesTable.slug }).from(categoriesTable).where(sql`${categoriesTable.id} IN ${categoryIds}`)
    : [];

  let brand = null;
  if (product.brandId) {
    const [b] = await db.select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug }).from(brandsTable).where(eq(brandsTable.id, product.brandId));
    brand = b ?? null;
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  res.json({
    ...product,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    images: images.map(i => ({ id: i.id, url: i.url, altText: i.altText, sortOrder: i.sortOrder })),
    variants: variants.map(v => ({ id: v.id, sku: v.sku, name: v.name, price: v.price, compareAtPrice: v.compareAtPrice, inventory: v.inventory, isAvailable: v.isAvailable, options: v.options, imageUrl: v.imageUrl })),
    specs: specs.map(s => ({ id: s.id, label: s.label, value: s.value })),
    faqs: faqs.map(f => ({ id: f.id, question: f.question, answer: f.answer })),
    brand,
    categories,
    reviewCount: reviews.length,
    avgRating: Math.round(avgRating * 10) / 10,
  });
});

router.put("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [product] = await db.update(productsTable).set({
    name: data.name,
    slug: data.slug,
    status: data.status as "DRAFT" | "ACTIVE" | "ARCHIVED" | undefined,
    shortDescription: data.shortDescription,
    description: data.description,
    price: data.price,
    compareAtPrice: data.compareAtPrice,
    cost: data.cost,
    weight: data.weight,
    weightUnit: data.weightUnit,
    brandId: data.brandId,
    distributorId: data.distributorId,
    isFeatured: data.isFeatured,
    isNewArrival: data.isNewArrival,
  }).where(eq(productsTable.id, raw)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(product);
});

router.delete("/products/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [product] = await db.delete(productsTable).where(eq(productsTable.id, raw)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
