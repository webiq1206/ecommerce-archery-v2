import { NextResponse } from "next/server";
import { db, categoriesTable } from "@workspace/db";
import { asc } from "drizzle-orm";

export async function GET() {
  const categories = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.name));
  return NextResponse.json(categories);
}
