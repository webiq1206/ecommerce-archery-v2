import { NextResponse } from "next/server";
import { db, addressesTable, insertAddressSchema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await params;
  const [existing] = await db.select().from(addressesTable).where(eq(addressesTable.id, id)).limit(1);
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }
  const body = await request.json();
  const parsed = insertAddressSchema.omit({ userId: true }).partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [updated] = await db
    .update(addressesTable)
    .set(parsed.data)
    .where(eq(addressesTable.id, id))
    .returning();
  return NextResponse.json(updated!);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { id } = await params;
  const [existing] = await db.select().from(addressesTable).where(eq(addressesTable.id, id)).limit(1);
  if (!existing || existing.userId !== userId) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }
  await db.delete(addressesTable).where(eq(addressesTable.id, id));
  return NextResponse.json({ success: true });
}
