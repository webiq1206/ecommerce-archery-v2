import { Router, type IRouter } from "express";
import { eq, sql, desc, and } from "drizzle-orm";
import { db, blogPostsTable, buyingGuidesTable } from "@workspace/db";
import { ListBlogPostsQueryParams, CreateBlogPostBody, UpdateBlogPostBody, GetBlogPostParams, DeleteBlogPostParams, CreateBuyingGuideBody, UpdateBuyingGuideBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/content/blog", async (req, res): Promise<void> => {
  const parsed = ListBlogPostsQueryParams.safeParse(req.query);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const { status, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (status) conditions.push(eq(blogPostsTable.status, status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [posts, countResult] = await Promise.all([
    db.select().from(blogPostsTable).where(where).orderBy(desc(blogPostsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(blogPostsTable).where(where),
  ]);
  const total = countResult[0]?.count ?? 0;

  res.json({
    posts: posts.map(p => ({ ...p, createdAt: p.createdAt.toISOString(), publishedAt: p.publishedAt?.toISOString() ?? null })),
    total, page, limit, totalPages: Math.ceil(total / limit),
  });
});

router.post("/content/blog", async (req, res): Promise<void> => {
  const parsed = CreateBlogPostBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [post] = await db.insert(blogPostsTable).values(parsed.data as any).returning();
  res.status(201).json({ ...post, createdAt: post.createdAt.toISOString() });
});

router.get("/content/blog/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [post] = await db.select().from(blogPostsTable).where(sql`${blogPostsTable.id} = ${raw} OR ${blogPostsTable.slug} = ${raw}`).limit(1);
  if (!post) { res.status(404).json({ error: "Blog post not found" }); return; }
  res.json({ ...post, createdAt: post.createdAt.toISOString(), publishedAt: post.publishedAt?.toISOString() ?? null });
});

router.put("/content/blog/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateBlogPostBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [post] = await db.update(blogPostsTable).set(parsed.data as any).where(eq(blogPostsTable.id, raw)).returning();
  if (!post) { res.status(404).json({ error: "Blog post not found" }); return; }
  res.json({ ...post, createdAt: post.createdAt.toISOString() });
});

router.delete("/content/blog/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [post] = await db.delete(blogPostsTable).where(eq(blogPostsTable.id, raw)).returning();
  if (!post) { res.status(404).json({ error: "Blog post not found" }); return; }
  res.sendStatus(204);
});

router.get("/content/guides", async (_req, res): Promise<void> => {
  const guides = await db.select().from(buyingGuidesTable).orderBy(desc(buyingGuidesTable.createdAt));
  res.json(guides.map(g => ({ ...g, createdAt: g.createdAt.toISOString(), publishedAt: g.publishedAt?.toISOString() ?? null })));
});

router.post("/content/guides", async (req, res): Promise<void> => {
  const parsed = CreateBuyingGuideBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [guide] = await db.insert(buyingGuidesTable).values(parsed.data as any).returning();
  res.status(201).json({ ...guide, createdAt: guide.createdAt.toISOString() });
});

router.get("/content/guides/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [guide] = await db.select().from(buyingGuidesTable).where(sql`${buyingGuidesTable.id} = ${raw} OR ${buyingGuidesTable.slug} = ${raw}`).limit(1);
  if (!guide) { res.status(404).json({ error: "Guide not found" }); return; }
  res.json({ ...guide, createdAt: guide.createdAt.toISOString(), publishedAt: guide.publishedAt?.toISOString() ?? null });
});

router.put("/content/guides/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateBuyingGuideBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [guide] = await db.update(buyingGuidesTable).set(parsed.data as any).where(eq(buyingGuidesTable.id, raw)).returning();
  if (!guide) { res.status(404).json({ error: "Guide not found" }); return; }
  res.json({ ...guide, createdAt: guide.createdAt.toISOString() });
});

export default router;
