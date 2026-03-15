import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { db, buyingGuidesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Buying Guides | Apex Archery",
  description:
    "Expert buying guides to help you choose the right archery gear. Compound bows, recurves, arrows, and more.",
  openGraph: {
    title: "Buying Guides | Apex Archery",
    description:
      "Expert buying guides to help you choose the right archery gear.",
    url: "/guides",
    siteName: "Apex Archery",
  },
};

export default async function GuidesPage() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://apexarchery.com";

  const guides = await db
    .select()
    .from(buyingGuidesTable)
    .where(eq(buyingGuidesTable.status, "PUBLISHED"))
    .orderBy(desc(buyingGuidesTable.publishedAt));

  return (
    <div className="bg-background text-foreground">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          { "@type": "ListItem", "position": 1, "name": "Home", "item": `${baseUrl}` },
          { "@type": "ListItem", "position": 2, "name": "Buying Guides", "item": `${baseUrl}/guides` },
        ]
      }) }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <nav className="flex items-center gap-2 text-sm text-secondary-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Buying Guides</span>
        </nav>

        <header className="mb-14">
          <span className="text-secondary-foreground text-xs font-bold tracking-[0.2em] uppercase block mb-4">
            Resources
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-normal text-foreground">
            Buying Guides
          </h1>
          <p className="text-secondary-foreground mt-4 max-w-2xl">
            Expert guides to help you choose the right archery gear for your needs.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {guides.map((guide) => (
            <Link
              key={guide.id}
              href={`/guides/${guide.slug}`}
              className="group block bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors"
            >
              {guide.coverImage && (
                <div className="aspect-video overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={guide.coverImage}
                    alt={guide.coverAlt ?? guide.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="font-display text-xl text-foreground group-hover:text-primary transition-colors">
                  {guide.title}
                </h2>
                {guide.excerpt && (
                  <p className="text-secondary-foreground text-sm mt-2 line-clamp-3">
                    {guide.excerpt}
                  </p>
                )}
                {guide.publishedAt && (
                  <time className="text-secondary-foreground text-xs mt-4 block">
                    {guide.publishedAt.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                )}
                <span className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-4 group-hover:gap-2 transition-all">
                  Read Guide
                </span>
              </div>
            </Link>
          ))}
        </div>

        {guides.length === 0 && (
          <div className="text-center py-20">
            <p className="text-secondary-foreground">No buying guides published yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
