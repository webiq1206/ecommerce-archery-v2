import type { Metadata } from "next";
import { db, productsTable, productImagesTable, brandsTable } from "@workspace/db";
import { asc, sql, desc } from "drizzle-orm";
import { AdminProductsClient } from "./AdminProductsClient";

export const metadata: Metadata = { title: "Admin Products" };

async function getProducts() {
  const products = await db.select().from(productsTable).orderBy(desc(productsTable.createdAt)).limit(50);
  const productIds = products.map((p) => p.id);
  if (productIds.length === 0) return [];

  const images = await db.select().from(productImagesTable).where(sql`${productImagesTable.productId} IN ${productIds}`).orderBy(asc(productImagesTable.sortOrder));
  const brandIds = [...new Set(products.map((p) => p.brandId).filter((id): id is string => id !== null))];
  const brands = brandIds.length > 0 ? await db.select({ id: brandsTable.id, name: brandsTable.name }).from(brandsTable).where(sql`${brandsTable.id} IN ${brandIds}`) : [];

  const imageMap = new Map<string, string>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
  }
  const brandMap = new Map(brands.map((b) => [b.id, b.name]));

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    price: p.price,
    status: p.status,
    imageUrl: imageMap.get(p.id) ?? null,
    brandName: p.brandId ? brandMap.get(p.brandId) ?? null : null,
  }));
}

export default async function AdminProductsPage() {
  const products = await getProducts();
  return <AdminProductsClient initialProducts={products} />;
}
