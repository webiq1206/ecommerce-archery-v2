import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db, wishlistItemsTable, productsTable, productImagesTable } from "@/lib/db";
import { AddToWishlistBody } from "@/lib/api-zod";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json([]);

  const items = await db.select().from(wishlistItemsTable).where(eq(wishlistItemsTable.userId, userId));
  const productIds = items.map((i) => i.productId);
  if (productIds.length === 0) return NextResponse.json([]);

  const products = await db.select().from(productsTable).where(sql`${productsTable.id} IN ${productIds}`);
  const images = await db.select().from(productImagesTable).where(sql`${productImagesTable.productId} IN ${productIds}`);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const imageMap = new Map<string, string>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
  }

  return NextResponse.json(
    items.map((item) => {
      const product = productMap.get(item.productId);
      return {
        id: item.id, productId: item.productId,
        product: { name: product?.name ?? "", price: product?.price ?? "0", imageUrl: imageMap.get(item.productId) ?? null },
      };
    })
  );
}

export async function POST(request: NextRequest) {
  const raw = await request.json();
  const parsed = AddToWishlistBody.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const data = parsed.data;
  const existing = await db.select().from(wishlistItemsTable).where(and(eq(wishlistItemsTable.userId, data.userId), eq(wishlistItemsTable.productId, data.productId)));
  if (existing.length > 0) return NextResponse.json({ message: "Already in wishlist" });

  const [item] = await db.insert(wishlistItemsTable).values({ userId: data.userId, productId: data.productId }).returning();
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const itemId = request.nextUrl.searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  await db.delete(wishlistItemsTable).where(eq(wishlistItemsTable.id, itemId));
  return new NextResponse(null, { status: 204 });
}
