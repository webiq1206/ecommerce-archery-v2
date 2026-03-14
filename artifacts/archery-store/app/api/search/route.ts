import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc, desc, sql, gte, lte } from "drizzle-orm";
import { db, productsTable, productImagesTable, brandsTable, reviewsTable } from "@workspace/db";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q") ?? "";
  const page = Number(sp.get("page")) || 1;
  const limit = Number(sp.get("limit")) || 24;
  const offset = (page - 1) * limit;

  if (!q) return NextResponse.json({ products: [], total: 0, page, limit, totalPages: 0 });

  const conditions = [
    eq(productsTable.status, "ACTIVE"),
    sql`(${productsTable.searchVector} @@ websearch_to_tsquery('english', ${q}) OR ${productsTable.name} ILIKE ${"%" + q + "%"})`,
  ];

  const brand = sp.get("brand");
  if (brand) {
    const [b] = await db.select({ id: brandsTable.id }).from(brandsTable).where(eq(brandsTable.slug, brand)).limit(1);
    if (b) conditions.push(eq(productsTable.brandId, b.id));
  }
  const minPrice = sp.get("minPrice");
  const maxPrice = sp.get("maxPrice");
  if (minPrice) conditions.push(gte(productsTable.price, minPrice));
  if (maxPrice) conditions.push(lte(productsTable.price, maxPrice));

  const where = and(...conditions);
  const rankExpr = sql`ts_rank(${productsTable.searchVector}, websearch_to_tsquery('english', ${q}))`;

  const sort = sp.get("sort");
  let orderByClause;
  if (sort === "price_asc") orderByClause = asc(productsTable.price);
  else if (sort === "price_desc") orderByClause = desc(productsTable.price);
  else if (sort === "newest") orderByClause = desc(productsTable.createdAt);
  else orderByClause = desc(rankExpr);

  const [products, countResult] = await Promise.all([
    db.select().from(productsTable).where(where).orderBy(orderByClause).limit(limit).offset(offset),
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
      id: p.id, name: p.name, slug: p.slug, price: p.price,
      compareAtPrice: p.compareAtPrice, isFeatured: p.isFeatured, isNewArrival: p.isNewArrival,
      createdAt: p.createdAt.toISOString(),
      images: imageMap.get(p.id) ?? [],
      brand: p.brandId ? brandMap.get(p.brandId) ?? null : null,
    })),
    total, page, limit, totalPages: Math.ceil(total / limit),
  });
}
