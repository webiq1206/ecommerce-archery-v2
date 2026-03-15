import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, productsTable } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { ids, action } = await request.json();

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No product IDs provided" }, { status: 400 });
  }

  switch (action) {
    case "activate":
      await db.update(productsTable).set({ status: "ACTIVE" }).where(sql`${productsTable.id} IN ${ids}`);
      return NextResponse.json({ updated: ids.length });
    case "archive":
      await db.update(productsTable).set({ status: "ARCHIVED" }).where(sql`${productsTable.id} IN ${ids}`);
      return NextResponse.json({ updated: ids.length });
    case "delete":
      await db.delete(productsTable).where(sql`${productsTable.id} IN ${ids}`);
      return NextResponse.json({ deleted: ids.length });
    default:
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
}
