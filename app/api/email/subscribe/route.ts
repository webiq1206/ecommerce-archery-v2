import { NextRequest, NextResponse } from "next/server";
import { db, emailSubscribersTable } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { email, source } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(emailSubscribersTable)
      .where(eq(emailSubscribersTable.email, email.toLowerCase()))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ success: true, message: "Already subscribed" });
    }

    await db.insert(emailSubscribersTable).values({
      email: email.toLowerCase(),
      source: source ?? "footer",
      isActive: true,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
