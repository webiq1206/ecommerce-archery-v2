import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, ordersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!reason) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  const [order] = await db
    .select()
    .from(ordersTable)
    .where(and(eq(ordersTable.id, id), eq(ordersTable.userId, session.user.id)));

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "DELIVERED") {
    return NextResponse.json(
      { error: "Only delivered orders can be returned" },
      { status: 400 }
    );
  }

  await db
    .update(ordersTable)
    .set({
      status: "REFUNDED",
      notes: order.notes
        ? `${order.notes}\n\nReturn requested: ${reason}`
        : `Return requested: ${reason}`,
    })
    .where(eq(ordersTable.id, id));

  return NextResponse.json({ success: true });
}
