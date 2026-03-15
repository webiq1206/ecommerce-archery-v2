import { NextRequest, NextResponse } from "next/server";
import { db, productsTable, productImagesTable } from "@/lib/db";
import { sql, asc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  if (ids.length === 0) return NextResponse.json({ products: [] });

  const products = await db
    .select()
    .from(productsTable)
    .where(sql`${productsTable.id} IN ${ids}`);

  const images = await db
    .select()
    .from(productImagesTable)
    .where(sql`${productImagesTable.productId} IN ${ids}`)
    .orderBy(asc(productImagesTable.sortOrder));

  const imageMap = new Map<string, string>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
  }

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      image: imageMap.get(p.id) ?? "/images/placeholder.jpg",
    })),
  });
}
