import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, productsTable } from "@workspace/db";

export async function POST(request: NextRequest) {
  const { productIds, distributorId } = await request.json();
  if (!Array.isArray(productIds) || !distributorId) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await db.update(productsTable).set({ distributorId }).where(sql`${productsTable.id} IN ${productIds}`);
  return NextResponse.json({ assigned: productIds.length });
}
