import { NextRequest, NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { db, reviewsTable } from "@/lib/db";
import { CreateReviewBody } from "@/lib/api-zod";

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId");
  if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

  const reviews = await db.select().from(reviewsTable)
    .where(and(eq(reviewsTable.productId, productId), eq(reviewsTable.isApproved, true)))
    .orderBy(desc(reviewsTable.createdAt));

  return NextResponse.json(reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
}

export async function POST(request: NextRequest) {
  const raw = await request.json();
  const parsed = CreateReviewBody.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const data = parsed.data;
  const [review] = await db.insert(reviewsTable).values({
    productId: data.productId, rating: data.rating, title: data.title,
    body: data.body, authorName: data.authorName,
  }).returning();
  return NextResponse.json({ ...review, createdAt: review.createdAt.toISOString() }, { status: 201 });
}
