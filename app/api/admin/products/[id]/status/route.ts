import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, productsTable } from "@/lib/db";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { status } = await request.json();

  if (!["DRAFT", "ACTIVE", "ARCHIVED"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const [updated] = await db.update(productsTable).set({ status }).where(eq(productsTable.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  return NextResponse.json({ id: updated.id, status: updated.status });
}
