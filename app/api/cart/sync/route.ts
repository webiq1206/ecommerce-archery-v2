import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, cartItemsTable } from "@/lib/db";

interface SyncItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, items } = (await request.json()) as {
      sessionId: string;
      items: SyncItem[];
    };

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));

    if (items.length > 0) {
      await db.insert(cartItemsTable).values(
        items.map((item) => ({
          sessionId,
          productId: item.productId,
          variantId: item.variantId ?? null,
          quantity: item.quantity,
        }))
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Cart sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
