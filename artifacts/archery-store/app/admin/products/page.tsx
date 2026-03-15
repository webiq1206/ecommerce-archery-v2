import type { Metadata } from "next";
import Link from "next/link";
import {
  db,
  productsTable,
  brandsTable,
  categoriesTable,
  productCategoriesTable,
  productImagesTable,
  distributorsTable,
} from "@workspace/db";
import { eq, sql, and, desc, asc } from "drizzle-orm";
import { AdminProductsClient } from "./AdminProductsClient";

export const metadata: Metadata = { title: "Admin Products" };

const PAGE_SIZE = 50;
type SortCol = "name" | "sku" | "price" | "status" | "createdAt";
type SortDir = "asc" | "desc";

async function getProducts(searchParams: {
  status?: string;
  category?: string;
  brand?: string;
  sort?: string;
  page?: string;
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10));
  const offset = (page - 1) * PAGE_SIZE;
  const [sortCol, sortDir] = (searchParams.sort ?? "createdAt-desc").split("-") as [SortCol, SortDir];
  const conditions: ReturnType<typeof eq>[] = [];

  if (searchParams.status && ["DRAFT", "ACTIVE", "ARCHIVED"].includes(searchParams.status)) {
    conditions.push(eq(productsTable.status, searchParams.status as "DRAFT" | "ACTIVE" | "ARCHIVED"));
  }

  if (searchParams.category) {
    const [cat] = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, searchParams.category!)).limit(1);
    if (cat) {
      const catPids = await db.select({ productId: productCategoriesTable.productId }).from(productCategoriesTable).where(eq(productCategoriesTable.categoryId, cat.id));
      if (catPids.length > 0) {
        conditions.push(sql`${productsTable.id} IN ${catPids.map((c) => c.productId)}`);
      } else {
        conditions.push(sql`false` as any);
      }
    }
  }

  if (searchParams.brand) {
    const [b] = await db.select({ id: brandsTable.id }).from(brandsTable).where(eq(brandsTable.slug, searchParams.brand!)).limit(1);
    if (b) conditions.push(eq(productsTable.brandId, b.id));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const orderBy = sortDir === "asc" ? asc(productsTable[sortCol] ?? productsTable.createdAt) : desc(productsTable[sortCol] ?? productsTable.createdAt);

  const [products, countResult] = await Promise.all([
    db
      .select({
        id: productsTable.id,
        name: productsTable.name,
        sku: productsTable.sku,
        price: productsTable.price,
        status: productsTable.status,
        brandId: productsTable.brandId,
        distributorId: productsTable.distributorId,
      })
      .from(productsTable)
      .where(where)
      .orderBy(orderBy)
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const productIds = products.map((p) => p.id);

  if (productIds.length === 0) {
    return { products: [], total, page, totalPages: 1, brands: [], categories: [] };
  }

  const brandIds = [...new Set(products.map((p) => p.brandId).filter((b): b is string => b != null))];
  const distIds = [...new Set(products.map((p) => p.distributorId).filter((d): d is string => d != null))];

  const [images, brandRows, distRows, catLinks] = await Promise.all([
    db.select().from(productImagesTable).where(sql`${productImagesTable.productId} IN ${productIds}`).orderBy(asc(productImagesTable.sortOrder)),
    brandIds.length > 0 ? db.select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug }).from(brandsTable).where(sql`${brandsTable.id} IN ${brandIds}`) : Promise.resolve([]),
    distIds.length > 0 ? db.select({ id: distributorsTable.id, name: distributorsTable.name }).from(distributorsTable).where(sql`${distributorsTable.id} IN ${distIds}`) : Promise.resolve([]),
    db.select({ productId: productCategoriesTable.productId, categoryId: productCategoriesTable.categoryId, isPrimary: productCategoriesTable.isPrimary }).from(productCategoriesTable).where(sql`${productCategoriesTable.productId} IN ${productIds}`),
  ]);

  const categoryIds = [...new Set(catLinks.map((c) => c.categoryId))];
  const catRows = categoryIds.length > 0 ? await db.select({ id: categoriesTable.id, name: categoriesTable.name, slug: categoriesTable.slug }).from(categoriesTable).where(sql`${categoriesTable.id} IN ${categoryIds}`) : [];

  const imageMap = new Map<string, string>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
  }
  const brandMap = new Map(brandRows.map((b) => [b.id, { name: b.name, slug: b.slug }]));
  const distMap = new Map(distRows.map((d) => [d.id, d.name]));
  const catMap = new Map(catRows.map((c) => [c.id, { name: c.name, slug: c.slug }]));
  const productToCat = new Map<string, string>();
  for (const pc of catLinks) {
    if (pc.isPrimary) productToCat.set(pc.productId, pc.categoryId);
    else if (!productToCat.has(pc.productId)) productToCat.set(pc.productId, pc.categoryId);
  }

  const brandList = await db.select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug }).from(brandsTable).orderBy(asc(brandsTable.name));
  const categoryList = await db.select({ id: categoriesTable.id, name: categoriesTable.name, slug: categoriesTable.slug }).from(categoriesTable).orderBy(asc(categoriesTable.name));

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      status: p.status,
      imageUrl: imageMap.get(p.id) ?? null,
      brandName: p.brandId ? brandMap.get(p.brandId)?.name ?? null : null,
      brandSlug: p.brandId ? brandMap.get(p.brandId)?.slug ?? null : null,
      distributorName: p.distributorId ? distMap.get(p.distributorId) ?? null : null,
      categoryName: productToCat.get(p.id) ? catMap.get(productToCat.get(p.id)!)?.name ?? null : null,
      categorySlug: productToCat.get(p.id) ? catMap.get(productToCat.get(p.id)!)?.slug ?? null : null,
    })),
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
    brands: brandList,
    categories: categoryList,
  };
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; category?: string; brand?: string; sort?: string; page?: string }>;
}) {
  const params = await searchParams;
  const { products, total, page, totalPages, brands, categories } = await getProducts(params);

  return (
    <AdminProductsClient
      initialProducts={products}
      total={total}
      page={page}
      totalPages={totalPages}
      brands={brands}
      categories={categories}
      searchParams={params}
    />
  );
}
