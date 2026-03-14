import { NextRequest, NextResponse } from "next/server";
import { eq, and, sql } from "drizzle-orm";
import { db, cartItemsTable, productsTable, productImagesTable } from "@workspace/db";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json([]);

  const items = await db.select().from(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
  const productIds = items.map((i) => i.productId);
  if (productIds.length === 0) return NextResponse.json([]);

  const products = await db.select().from(productsTable).where(sql`${productsTable.id} IN ${productIds}`);
  const images = await db.select().from(productImagesTable).where(sql`${productImagesTable.productId} IN ${productIds}`).orderBy(productImagesTable.sortOrder);

  const productMap = new Map(products.map((p) => [p.id, p]));
  const imageMap = new Map<string, string>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
  }

  return NextResponse.json(
    items.map((item) => {
      const product = productMap.get(item.productId);
      return {
        id: item.id, productId: item.productId, variantId: item.variantId, quantity: item.quantity,
        product: { name: product?.name ?? "", slug: product?.slug ?? "", price: product?.price ?? "0", imageUrl: imageMap.get(item.productId) ?? null },
      };
    })
  );
}

export async function POST(request: NextRequest) {
  const data = await request.json();
  const { productId, variantId, quantity = 1, sessionId } = data;

  if (sessionId) {
    const existingConditions = [eq(cartItemsTable.sessionId, sessionId), eq(cartItemsTable.productId, productId)];
    if (variantId) existingConditions.push(eq(cartItemsTable.variantId, variantId));
    const existing = await db.select().from(cartItemsTable).where(and(...existingConditions));
    if (existing.length > 0) {
      const [updated] = await db.update(cartItemsTable).set({ quantity: existing[0].quantity + quantity }).where(eq(cartItemsTable.id, existing[0].id)).returning();
      return NextResponse.json({ id: updated.id, productId, quantity: updated.quantity }, { status: 201 });
    }
  }

  const [item] = await db.insert(cartItemsTable).values({ productId, variantId, quantity, sessionId }).returning();
  return NextResponse.json({ id: item.id, productId, quantity: item.quantity }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const data = await request.json();
  const { itemId, quantity } = data;
  if (quantity <= 0) {
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
    return new NextResponse(null, { status: 204 });
  }
  const [item] = await db.update(cartItemsTable).set({ quantity }).where(eq(cartItemsTable.id, itemId)).returning();
  if (!item) return NextResponse.json({ error: "Cart item not found" }, { status: 404 });
  return NextResponse.json({ id: item.id, quantity: item.quantity });
}

export async function DELETE(request: NextRequest) {
  const itemId = request.nextUrl.searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId required" }, { status: 400 });
  await db.delete(cartItemsTable).where(eq(cartItemsTable.id, itemId));
  return new NextResponse(null, { status: 204 });
}
