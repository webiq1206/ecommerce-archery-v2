import { Router, type IRouter } from "express";
import { eq, sql, desc, and, type SQL } from "drizzle-orm";
import { db, blogPostsTable, buyingGuidesTable } from "@workspace/db";
import { ListBlogPostsQueryParams, CreateBlogPostBody, UpdateBlogPostBody, CreateBuyingGuideBody, UpdateBuyingGuideBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/content/blog", async (req, res): Promise<void> => {
  const parsed = ListBlogPostsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { status, page = 1, limit = 20 } = parsed.data;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [];
  if (status) conditions.push(eq(blogPostsTable.status, status as "DRAFT" | "PUBLISHED" | "ARCHIVED"));
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
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [post] = await db.insert(blogPostsTable).values({
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    body: data.body,
    coverImage: data.coverImage,
    coverAlt: data.coverAlt,
    seoTitle: data.seoTitle,
    seoDesc: data.seoDesc,
    status: data.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined,
    tags: data.tags,
  }).returning();
  res.status(201).json({ ...post, createdAt: post.createdAt.toISOString() });
});

router.get("/content/blog/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [post] = await db.select().from(blogPostsTable).where(sql`${blogPostsTable.id} = ${raw} OR ${blogPostsTable.slug} = ${raw}`).limit(1);
  if (!post) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  res.json({ ...post, createdAt: post.createdAt.toISOString(), publishedAt: post.publishedAt?.toISOString() ?? null });
});

router.put("/content/blog/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateBlogPostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [post] = await db.update(blogPostsTable).set({
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    body: data.body,
    coverImage: data.coverImage,
    coverAlt: data.coverAlt,
    seoTitle: data.seoTitle,
    seoDesc: data.seoDesc,
    status: data.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined,
    tags: data.tags,
  }).where(eq(blogPostsTable.id, raw)).returning();
  if (!post) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  res.json({ ...post, createdAt: post.createdAt.toISOString() });
});

router.delete("/content/blog/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [post] = await db.delete(blogPostsTable).where(eq(blogPostsTable.id, raw)).returning();
  if (!post) {
    res.status(404).json({ error: "Blog post not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/content/guides", async (_req, res): Promise<void> => {
  const guides = await db.select().from(buyingGuidesTable).orderBy(desc(buyingGuidesTable.createdAt));
  res.json(guides.map(g => ({ ...g, createdAt: g.createdAt.toISOString(), publishedAt: g.publishedAt?.toISOString() ?? null })));
});

router.post("/content/guides", async (req, res): Promise<void> => {
  const parsed = CreateBuyingGuideBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [guide] = await db.insert(buyingGuidesTable).values({
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    body: data.body,
    coverImage: data.coverImage,
    coverAlt: data.coverAlt,
    seoTitle: data.seoTitle,
    seoDesc: data.seoDesc,
    categoryId: data.categoryId,
    status: data.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined,
  }).returning();
  res.status(201).json({ ...guide, createdAt: guide.createdAt.toISOString() });
});

router.get("/content/guides/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [guide] = await db.select().from(buyingGuidesTable).where(sql`${buyingGuidesTable.id} = ${raw} OR ${buyingGuidesTable.slug} = ${raw}`).limit(1);
  if (!guide) {
    res.status(404).json({ error: "Guide not found" });
    return;
  }
  res.json({ ...guide, createdAt: guide.createdAt.toISOString(), publishedAt: guide.publishedAt?.toISOString() ?? null });
});

router.put("/content/guides/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const parsed = UpdateBuyingGuideBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const data = parsed.data;
  const [guide] = await db.update(buyingGuidesTable).set({
    title: data.title,
    slug: data.slug,
    excerpt: data.excerpt,
    body: data.body,
    coverImage: data.coverImage,
    coverAlt: data.coverAlt,
    seoTitle: data.seoTitle,
    seoDesc: data.seoDesc,
    categoryId: data.categoryId,
    status: data.status as "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined,
  }).where(eq(buyingGuidesTable.id, raw)).returning();
  if (!guide) {
    res.status(404).json({ error: "Guide not found" });
    return;
  }
  res.json({ ...guide, createdAt: guide.createdAt.toISOString() });
});

export default router;
