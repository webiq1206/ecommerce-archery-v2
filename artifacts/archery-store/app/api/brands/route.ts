import { NextResponse } from "next/server";
import { db, brandsTable } from "@workspace/db";
import { asc } from "drizzle-orm";

export async function GET() {
  const brands = await db.select().from(brandsTable).orderBy(asc(brandsTable.name));
  return NextResponse.json(brands);
}
