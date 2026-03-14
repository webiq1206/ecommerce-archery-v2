import { Router, type IRouter } from "express";
import { eq, sql, desc, and } from "drizzle-orm";
import { db, reviewsTable } from "@workspace/db";
import { ListReviewsQueryParams, CreateReviewBody, UpdateReviewBody, DeleteReviewParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/reviews", async (req, res): Promise<void> => {
  const parsed = ListReviewsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { productId, approved, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (productId) conditions.push(eq(reviewsTable.productId, productId));
  if (approved !== undefined) conditions.push(eq(reviewsTable.isApproved, approved));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [reviews, countResult] = await Promise.all([
    db.select().from(reviewsTable).where(where).orderBy(desc(reviewsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(reviewsTable).where(where),
  ]);
  const total = countResult[0]?.count ?? 0;

  res.json({
    reviews: reviews.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })),
    total, page, limit, totalPages: Math.ceil(total / limit),
  });
});

router.post("/reviews", async (req, res): Promise<void> => {
  const parsed = CreateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [review] = await db.insert(reviewsTable).values(parsed.data as any).returning();
  res.status(201).json({ ...review, createdAt: review.createdAt.toISOString() });
});

router.put("/reviews/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateReviewBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [review] = await db.update(reviewsTable).set(parsed.data as any).where(eq(reviewsTable.id, raw)).returning();
  if (!review) { res.status(404).json({ error: "Review not found" }); return; }
  res.json({ ...review, createdAt: review.createdAt.toISOString() });
});

router.delete("/reviews/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [review] = await db.delete(reviewsTable).where(eq(reviewsTable.id, raw)).returning();
  if (!review) { res.status(404).json({ error: "Review not found" }); return; }
  res.sendStatus(204);
});

export default router;
