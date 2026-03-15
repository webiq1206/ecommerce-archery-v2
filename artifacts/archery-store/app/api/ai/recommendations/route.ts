import { NextRequest, NextResponse } from "next/server";
import { db, productsTable, productTagsTable, productCategoriesTable } from "@workspace/db";
import { eq, sql, and, desc } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { productId, tags, categoryId } = await req.json();

  if (!productId) {
    return NextResponse.json({ error: "Product ID required" }, { status: 400 });
  }

  let recommendedIds: string[] = [];

  // Find products with shared tags
  if (tags && tags.length > 0) {
    const taggedProducts = await db
      .select({ productId: productTagsTable.productId })
      .from(productTagsTable)
      .where(
        and(
          sql`${productTagsTable.tag} IN ${tags}`,
          sql`${productTagsTable.productId} != ${productId}`
        )
      )
      .limit(8);
    recommendedIds = taggedProducts.map((t) => t.productId);
  }

  // Fallback: same category
  if (recommendedIds.length < 4 && categoryId) {
    const catProducts = await db
      .select({ productId: productCategoriesTable.productId })
      .from(productCategoriesTable)
      .where(
        and(
          eq(productCategoriesTable.categoryId, categoryId),
          sql`${productCategoriesTable.productId} != ${productId}`
        )
      )
      .limit(8);

    for (const cp of catProducts) {
      if (!recommendedIds.includes(cp.productId)) {
        recommendedIds.push(cp.productId);
      }
    }
  }

  if (recommendedIds.length === 0) {
    return NextResponse.json({ recommendations: [] });
  }

  const products = await db
    .select({
      id: productsTable.id,
      name: productsTable.name,
      slug: productsTable.slug,
      price: productsTable.price,
    })
    .from(productsTable)
    .where(
      and(
        sql`${productsTable.id} IN ${recommendedIds.slice(0, 8)}`,
        eq(productsTable.status, "ACTIVE")
      )
    )
    .limit(8);

  return NextResponse.json({ recommendations: products });
}
