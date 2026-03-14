import { NextRequest, NextResponse } from "next/server";
import { eq, and, ilike, sql, desc, asc, gte, lte, type SQL } from "drizzle-orm";
import { db, productsTable, productImagesTable, brandsTable, reviewsTable, categoriesTable, productCategoriesTable } from "@workspace/db";
import { CreateProductBody } from "@workspace/api-zod";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const page = Number(sp.get("page")) || 1;
  const limit = Number(sp.get("limit")) || 24;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];
  const status = sp.get("status");
  if (status) conditions.push(eq(productsTable.status, status as "DRAFT" | "ACTIVE" | "ARCHIVED"));
  else conditions.push(eq(productsTable.status, "ACTIVE"));

  const featured = sp.get("featured");
  if (featured !== null) conditions.push(eq(productsTable.isFeatured, featured === "true"));

  const search = sp.get("search");
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));

  const category = sp.get("category");
  if (category) {
    const cat = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, category)).limit(1);
    if (cat.length > 0) {
      const catPids = await db.select({ productId: productCategoriesTable.productId }).from(productCategoriesTable).where(eq(productCategoriesTable.categoryId, cat[0].id));
      if (catPids.length > 0) conditions.push(sql`${productsTable.id} IN ${catPids.map((c) => c.productId)}`);
      else conditions.push(sql`false`);
    }
  }

  const brand = sp.get("brand");
  if (brand) {
    const b = await db.select({ id: brandsTable.id }).from(brandsTable).where(eq(brandsTable.slug, brand)).limit(1);
    if (b.length > 0) conditions.push(eq(productsTable.brandId, b[0].id));
  }

  const minPrice = sp.get("minPrice");
  const maxPrice = sp.get("maxPrice");
  if (minPrice) conditions.push(gte(productsTable.price, minPrice));
  if (maxPrice) conditions.push(lte(productsTable.price, maxPrice));

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const sort = sp.get("sort");
  let orderBy;
  if (sort === "price_asc") orderBy = asc(productsTable.price);
  else if (sort === "price_desc") orderBy = desc(productsTable.price);
  else if (sort === "name_asc") orderBy = asc(productsTable.name);
  else orderBy = desc(productsTable.createdAt);

  const [products, countResult] = await Promise.all([
    db.select().from(productsTable).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const productIds = products.map((p) => p.id);

  const images = productIds.length > 0 ? await db.select().from(productImagesTable).where(sql`${productImagesTable.productId} IN ${productIds}`).orderBy(asc(productImagesTable.sortOrder)) : [];
  const brandIds = [...new Set(products.map((p) => p.brandId).filter((id): id is string => id !== null))];
  const brands = brandIds.length > 0 ? await db.select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug }).from(brandsTable).where(sql`${brandsTable.id} IN ${brandIds}`) : [];

  const imageMap = new Map<string, Array<{ id: string; url: string; altText: string | null; sortOrder: number }>>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, []);
    imageMap.get(img.productId)!.push({ id: img.id, url: img.url, altText: img.altText, sortOrder: img.sortOrder });
  }
  const brandMap = new Map(brands.map((b) => [b.id, b]));

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id, name: p.name, slug: p.slug, sku: p.sku, status: p.status,
      shortDescription: p.shortDescription, price: p.price, compareAtPrice: p.compareAtPrice,
      isFeatured: p.isFeatured, isNewArrival: p.isNewArrival,
      createdAt: p.createdAt.toISOString(),
      images: imageMap.get(p.id) ?? [],
      brand: p.brandId ? brandMap.get(p.brandId) ?? null : null,
    })),
    total, page, limit, totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const raw = await request.json();
  const parsed = CreateProductBody.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const data = parsed.data;
  const [product] = await db.insert(productsTable).values({
    name: data.name, slug: data.slug, sku: data.sku, price: data.price,
    status: (data.status as "DRAFT" | "ACTIVE" | "ARCHIVED") || "ACTIVE",
    shortDescription: data.shortDescription,
    description: data.description, compareAtPrice: data.compareAtPrice,
    brandId: data.brandId, distributorId: data.distributorId,
    isFeatured: data.isFeatured, isNewArrival: data.isNewArrival,
  }).returning();
  return NextResponse.json(product, { status: 201 });
}
