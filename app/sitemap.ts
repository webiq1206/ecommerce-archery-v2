import type { MetadataRoute } from "next";
import {
  db,
  productsTable,
  categoriesTable,
  collectionsTable,
  blogPostsTable,
  buyingGuidesTable,
  flatPagesTable,
} from "@/lib/db";
import { eq, and } from "drizzle-orm";

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://apexarchery.com")
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const entries: MetadataRoute.Sitemap = [];

  // Homepage
  entries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
  });

  // Active products
  const products = await db
    .select({ slug: productsTable.slug, updatedAt: productsTable.updatedAt })
    .from(productsTable)
    .where(eq(productsTable.status, "ACTIVE"));

  for (const p of products) {
    entries.push({
      url: `${baseUrl}/products/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly",
      priority: 0.9,
    });
  }

  // Active categories (build slug path for nested)
  const categories = await db
    .select({
      id: categoriesTable.id,
      slug: categoriesTable.slug,
      parentId: categoriesTable.parentId,
      updatedAt: categoriesTable.updatedAt,
    })
    .from(categoriesTable)
    .where(eq(categoriesTable.isActive, true));

  const slugById = new Map(categories.map((c) => [c.id, c.slug]));
  const parentById = new Map(categories.map((c) => [c.id, c.parentId]));

  function getPath(id: string): string {
    const parentId = parentById.get(id);
    const slug = slugById.get(id) ?? "";
    if (!parentId) return slug;
    return `${getPath(parentId)}/${slug}`;
  }

  for (const c of categories) {
    const path = getPath(c.id);
    entries.push({
      url: `${baseUrl}/categories/${path}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Active collections
  const collections = await db
    .select({ slug: collectionsTable.slug, updatedAt: collectionsTable.updatedAt })
    .from(collectionsTable)
    .where(eq(collectionsTable.isActive, true));

  for (const c of collections) {
    entries.push({
      url: `${baseUrl}/collections/${c.slug}`,
      lastModified: c.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  // Published blog posts
  const blogPosts = await db
    .select({ slug: blogPostsTable.slug, publishedAt: blogPostsTable.publishedAt })
    .from(blogPostsTable)
    .where(eq(blogPostsTable.status, "PUBLISHED"));

  for (const p of blogPosts) {
    entries.push({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: p.publishedAt ?? new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  // Published buying guides
  const guides = await db
    .select({ slug: buyingGuidesTable.slug, publishedAt: buyingGuidesTable.publishedAt })
    .from(buyingGuidesTable)
    .where(eq(buyingGuidesTable.status, "PUBLISHED"));

  for (const g of guides) {
    entries.push({
      url: `${baseUrl}/guides/${g.slug}`,
      lastModified: g.publishedAt ?? new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }

  // Published flat pages
  const flatPages = await db
    .select({ slug: flatPagesTable.slug, updatedAt: flatPagesTable.updatedAt })
    .from(flatPagesTable);

  for (const p of flatPages) {
    entries.push({
      url: `${baseUrl}/pages/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}
