import { NextResponse } from "next/server";
import { db, distributorsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let body: {
    name?: string;
    contactName?: string | null;
    email?: string;
    ccEmails?: string[] | null;
    phone?: string | null;
    notes?: string | null;
    isActive?: boolean;
  };
  try {
    body = await _req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const [updated] = await db
    .update(distributorsTable)
    .set({
      name: body.name ?? undefined,
      contactName: body.contactName ?? undefined,
      email: body.email ?? undefined,
      ccEmails: body.ccEmails ?? undefined,
      phone: body.phone ?? undefined,
      notes: body.notes ?? undefined,
      isActive: body.isActive ?? undefined,
    })
    .where(eq(distributorsTable.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Distributor not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
