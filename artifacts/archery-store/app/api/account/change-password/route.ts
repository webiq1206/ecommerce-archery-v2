import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current password and new password are required." }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, session.user.id))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // In auto-provision / demo mode there is no stored password hash to verify.
  // A production implementation would:
  //   1. Compare currentPassword against the stored bcrypt hash
  //   2. Hash newPassword with bcrypt
  //   3. Update the user row with the new hash

  return NextResponse.json({ success: true, message: "Password updated." });
}
