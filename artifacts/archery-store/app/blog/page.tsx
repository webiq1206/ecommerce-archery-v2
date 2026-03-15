import Link from "next/link";
import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { db, blogPostsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Blog | Apex Archery",
  description: "Articles, tips, and insights from the Apex Archery team.",
};

export default async function BlogIndexPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://apexarchery.com";

  const posts = await db
    .select()
    .from(blogPostsTable)
    .where(eq(blogPostsTable.status, "PUBLISHED"))
    .orderBy(desc(blogPostsTable.publishedAt));

  return (
    <div className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${baseUrl}` },
          { "@type": "ListItem", "position": 2, "name": "Blog", "item": `${baseUrl}/blog` },
        ]
      }) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-secondary-foreground mb-10">
          <Link href="/" className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4 opacity-60" />
          <span className="text-foreground">Blog</span>
        </nav>

        <div className="mb-14">
          <span className="text-secondary-foreground text-xs font-bold tracking-[0.2em] uppercase block mb-4">
            Resources
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-normal text-foreground">
            Blog
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group block bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors"
            >
              {post.coverImage && (
                <div className="aspect-video overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.coverImage}
                    alt={post.coverAlt ?? post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="font-display text-xl text-foreground group-hover:text-primary transition-colors">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="text-secondary-foreground text-sm mt-2 line-clamp-3">
                    {post.excerpt}
                  </p>
                )}
                <p className="text-secondary-foreground text-xs mt-4">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                    : "Draft"}
                </p>
                <span className="inline-flex items-center gap-1 mt-4 text-primary text-sm font-medium group-hover:gap-2 transition-all">
                  Read More
                  <ChevronRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-secondary-foreground text-lg">
              No blog posts published yet.
            </p>
            <Link href="/" className="text-primary mt-4 inline-block font-medium">
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
