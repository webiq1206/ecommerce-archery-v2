import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone } = body;

  await db
    .update(usersTable)
    .set({ name, phone })
    .where(eq(usersTable.id, session.user.id));

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db.delete(usersTable).where(eq(usersTable.id, session.user.id));

  return NextResponse.json({ success: true });
}
