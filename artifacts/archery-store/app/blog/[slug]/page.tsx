import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { db, blogPostsTable, usersTable } from "@workspace/db";
import { eq, desc, sql, and } from "drizzle-orm";
import { SocialShare } from "@/components/content/SocialShare";

export const revalidate = 3600;

function extractToc(html: string): { id: string; text: string; level: "h2" | "h3" }[] {
  const toc: { id: string; text: string; level: "h2" | "h3" }[] = [];
  const h2Regex = /<h2[^>]*>([^<]+)<\/h2>/gi;
  const h3Regex = /<h3[^>]*>([^<]+)<\/h3>/gi;
  const slugify = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  let match;
  while ((match = h2Regex.exec(html)) !== null) {
    const text = match[1].trim();
    toc.push({ id: slugify(text), text, level: "h2" });
  }
  while ((match = h3Regex.exec(html)) !== null) {
    const text = match[1].trim();
    toc.push({ id: slugify(text), text, level: "h3" });
  }
  return toc;
}

export async function generateStaticParams() {
  const posts = await db
    .select({ slug: blogPostsTable.slug })
    .from(blogPostsTable)
    .where(eq(blogPostsTable.status, "PUBLISHED"));
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [post] = await db
    .select()
    .from(blogPostsTable)
    .where(eq(blogPostsTable.slug, slug))
    .limit(1);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDesc ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.seoTitle ?? post.title,
      description: post.seoDesc ?? post.excerpt ?? undefined,
      url: `/blog/${slug}`,
      siteName: "Apex Archery",
      images: post.coverImage ? [{ url: post.coverImage, alt: post.coverAlt ?? post.title }] : undefined,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
    },
    twitter: { card: "summary_large_image", title: post.seoTitle ?? post.title },
    alternates: { canonical: `/blog/${slug}` },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [post] = await db
    .select()
    .from(blogPostsTable)
    .where(and(eq(blogPostsTable.slug, slug), eq(blogPostsTable.status, "PUBLISHED")))
    .limit(1);

  if (!post) notFound();

  const author = post.authorId
    ? (
        await db
          .select({ name: usersTable.name })
          .from(usersTable)
          .where(eq(usersTable.id, post.authorId))
          .limit(1)
      )[0]
    : null;

  const postTags = post.tags ?? [];
  let relatedPosts = await db
    .select()
    .from(blogPostsTable)
    .where(
      and(
        eq(blogPostsTable.status, "PUBLISHED"),
        sql`${blogPostsTable.id} != ${post.id}`,
        postTags.length > 0 ? sql`${blogPostsTable.tags} && ${postTags}` : sql`1=1`
      )
    )
    .orderBy(desc(blogPostsTable.publishedAt))
    .limit(3);

  if (relatedPosts.length < 3 && postTags.length > 0) {
    const excludeIds = relatedPosts.map((r) => r.id);
    const more = await db
      .select()
      .from(blogPostsTable)
      .where(
        and(
          eq(blogPostsTable.status, "PUBLISHED"),
          sql`${blogPostsTable.id} != ${post.id}`,
          excludeIds.length > 0
            ? sql`${blogPostsTable.id} NOT IN (${sql.join(excludeIds.map((id) => sql`${id}`), sql`, `)})`
            : sql`1=1`
        )
      )
      .orderBy(desc(blogPostsTable.publishedAt))
      .limit(3 - relatedPosts.length);
    relatedPosts = [...relatedPosts, ...more];
  }

  const toc = extractToc(post.body);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://apexarchery.com";

  const articleSchemaData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? post.seoDesc,
    image: post.coverImage,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: author?.name
      ? { "@type": "Person", name: author.name }
      : { "@type": "Organization", name: "Apex Archery" },
    publisher: { "@type": "Organization", name: "Apex Archery", logo: { "@type": "ImageObject", url: `${baseUrl}/logo.png` } },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${baseUrl}/blog/${slug}` },
  };

  const blogBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${baseUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${baseUrl}/blog/${slug}` },
    ],
  };

  return (
    <article className="bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchemaData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogBreadcrumb) }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <nav className="flex items-center gap-2 text-sm text-secondary-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/blog" className="hover:text-primary transition-colors">
            Blog
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground truncate max-w-[200px]">{post.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-12">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-normal text-foreground mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-secondary-foreground text-sm mb-8">
              {author?.name && <span>{author.name}</span>}
              {post.publishedAt && (
                <time dateTime={post.publishedAt.toISOString()}>
                  {post.publishedAt.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </time>
              )}
            </div>

            {post.coverImage && (
              <div className="rounded-xl overflow-hidden mb-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImage}
                  alt={post.coverAlt ?? post.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            <div
              className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-a:text-primary prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: post.body }}
            />

            <div className="mt-10 pt-8 border-t border-border">
              <span className="text-secondary-foreground text-xs font-bold tracking-[0.2em] uppercase block mb-3">
                Share
              </span>
              <SocialShare url={`${baseUrl}/blog/${slug}`} title={post.title} />
            </div>

            {relatedPosts.length > 0 && (
              <section className="mt-16 pt-12 border-t border-border">
                <h2 className="font-display text-2xl text-foreground mb-6">Related Posts</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {relatedPosts.map((r) => (
                    <Link
                      key={r.id}
                      href={`/blog/${r.slug}`}
                      className="group block bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors"
                    >
                      {r.coverImage && (
                        <div className="aspect-video overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.coverImage}
                            alt={r.coverAlt ?? r.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-display text-lg text-foreground group-hover:text-primary transition-colors">
                          {r.title}
                        </h3>
                        {r.publishedAt && (
                          <time className="text-secondary-foreground text-xs mt-1 block">
                            {r.publishedAt.toLocaleDateString("en-US")}
                          </time>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          {toc.length > 0 && (
            <aside className="lg:block hidden">
              <div className="sticky top-24">
                <span className="text-secondary-foreground text-xs font-bold tracking-[0.2em] uppercase block mb-4">
                  On this page
                </span>
                <nav className="space-y-2">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm hover:text-primary transition-colors ${item.level === "h3" ? "pl-4" : ""}`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          )}
        </div>
      </div>
    </article>
  );
}
