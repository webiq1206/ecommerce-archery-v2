import { NextResponse } from "next/server";
import { db, addressesTable, insertAddressSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const addresses = await db
    .select()
    .from(addressesTable)
    .where(eq(addressesTable.userId, userId));
  return NextResponse.json(addresses);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const parsed = insertAddressSchema.safeParse({ ...body, userId });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const [addr] = await db.insert(addressesTable).values(parsed.data).returning();
  return NextResponse.json(addr);
}
