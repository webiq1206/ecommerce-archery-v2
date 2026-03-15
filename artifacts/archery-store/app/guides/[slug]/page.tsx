import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { db, buyingGuidesTable, productsTable, productImagesTable, categoriesTable } from "@workspace/db";
import { eq, desc, and, sql, asc } from "drizzle-orm";
import { SocialShare } from "@/components/content/SocialShare";
import { GuideViewTracker } from "@/components/analytics/GuideViewTracker";

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

function extractFaqFromBody(html: string): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  const stripped = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const qaPattern = /(?:Q[:\s]|Question[:\s]|^)\s*([^?]+\?)\s*(?:A[:\s]|Answer[:\s])?\s*([^.]+(?:\.[^.]+)*)/gi;
  let m;
  while ((m = qaPattern.exec(stripped)) !== null) {
    const question = m[1].trim();
    const answer = m[2].trim();
    if (question.length > 10 && answer.length > 20) {
      faqs.push({ question, answer });
    }
  }
  return faqs.slice(0, 10);
}

export async function generateStaticParams() {
  const guides = await db
    .select({ slug: buyingGuidesTable.slug })
    .from(buyingGuidesTable)
    .where(eq(buyingGuidesTable.status, "PUBLISHED"));
  return guides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [guide] = await db
    .select()
    .from(buyingGuidesTable)
    .where(eq(buyingGuidesTable.slug, slug))
    .limit(1);
  if (!guide) return { title: "Guide Not Found" };
  return {
    title: guide.seoTitle ?? guide.title,
    description: guide.seoDesc ?? guide.excerpt ?? undefined,
    openGraph: {
      title: guide.seoTitle ?? guide.title,
      description: guide.seoDesc ?? guide.excerpt ?? undefined,
      url: `/guides/${slug}`,
      siteName: "Apex Archery",
      images: guide.coverImage ? [{ url: guide.coverImage, alt: guide.coverAlt ?? guide.title }] : undefined,
      type: "article",
      publishedTime: guide.publishedAt?.toISOString(),
    },
    twitter: { card: "summary_large_image", title: guide.seoTitle ?? guide.title },
    alternates: { canonical: `/guides/${slug}` },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [guide] = await db
    .select()
    .from(buyingGuidesTable)
    .where(
      and(eq(buyingGuidesTable.slug, slug), eq(buyingGuidesTable.status, "PUBLISHED"))
    )
    .limit(1);

  if (!guide) notFound();

  const [relatedGuides, quickPickProducts] = await Promise.all([
    db
      .select()
      .from(buyingGuidesTable)
      .where(and(eq(buyingGuidesTable.status, "PUBLISHED"), sql`${buyingGuidesTable.id} != ${guide.id}`))
      .orderBy(desc(buyingGuidesTable.publishedAt))
      .limit(3),
    (async () => {
      // Fetch products from the guide's associated category if available
      const categorySlug = guide.slug.replace(/-guide$/, "").replace(/-buying$/, "");
      const [cat] = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, categorySlug)).limit(1);

      const products = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.status, "ACTIVE"))
        .orderBy(desc(productsTable.isFeatured), desc(productsTable.createdAt))
        .limit(4);

      if (products.length === 0) return [];

      const pIds = products.map((p) => p.id);
      const images = await db.select().from(productImagesTable).where(sql`${productImagesTable.productId} IN ${pIds}`).orderBy(asc(productImagesTable.sortOrder));
      const imageMap = new Map<string, string>();
      for (const img of images) {
        if (!imageMap.has(img.productId)) imageMap.set(img.productId, img.url);
      }

      return products.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        imageUrl: imageMap.get(p.id) ?? null,
      }));
    })(),
  ]);

  const toc = extractToc(guide.body);
  const faqs = extractFaqFromBody(guide.body);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://apexarchery.com";

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt ?? guide.seoDesc,
    image: guide.coverImage,
    datePublished: guide.publishedAt?.toISOString(),
    dateModified: guide.updatedAt.toISOString(),
    author: { "@type": "Organization", name: "Apex Archery" },
    publisher: {
      "@type": "Organization",
      name: "Apex Archery",
      logo: { "@type": "ImageObject", url: `${baseUrl}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${baseUrl}/guides/${slug}` },
  };

  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null;

  const guideBreadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${baseUrl}/guides` },
      { "@type": "ListItem", position: 3, name: guide.title, item: `${baseUrl}/guides/${slug}` },
    ],
  };

  return (
    <article className="bg-background text-foreground">
      <GuideViewTracker slug={slug} title={guide.title} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(guideBreadcrumb) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <nav className="flex items-center gap-2 text-sm text-secondary-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/guides" className="hover:text-primary transition-colors">
            Buying Guides
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground truncate max-w-[200px]">{guide.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-12">
          <div>
            <h1 className="font-display text-4xl md:text-5xl font-normal text-foreground mb-4">
              {guide.title}
            </h1>
            {guide.publishedAt && (
              <time
                dateTime={guide.publishedAt.toISOString()}
                className="text-secondary-foreground text-sm block mb-8"
              >
                {guide.publishedAt.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}

            {guide.coverImage && (
              <div className="rounded-xl overflow-hidden mb-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={guide.coverImage}
                  alt={guide.coverAlt ?? guide.title}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            {quickPickProducts.length > 0 && (
              <section className="mb-10 p-6 rounded-xl border border-border bg-card/50">
                <span className="text-secondary-foreground text-xs font-bold tracking-[0.2em] uppercase block mb-3">
                  Quick Picks
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  {quickPickProducts.map((p) => (
                    <Link
                      key={p.id}
                      href={`/products/${p.slug}`}
                      className="group block bg-background rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors"
                    >
                      <div className="aspect-square bg-muted overflow-hidden">
                        {p.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imageUrl}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-secondary-foreground text-xs">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {p.name}
                        </h3>
                        <p className="text-primary font-bold text-sm mt-1">
                          ${(Number(p.price) / 100).toFixed(2)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <div
              className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-a:text-primary prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: guide.body }}
            />

            <div className="mt-10 pt-8 border-t border-border">
              <span className="text-secondary-foreground text-xs font-bold tracking-[0.2em] uppercase block mb-3">
                Share
              </span>
              <SocialShare url={`${baseUrl}/guides/${slug}`} title={guide.title} />
            </div>

            {relatedGuides.length > 0 && (
              <section className="mt-16 pt-12 border-t border-border">
                <h2 className="font-display text-2xl text-foreground mb-6">Related Guides</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {relatedGuides.map((r) => (
                    <Link
                      key={r.id}
                      href={`/guides/${r.slug}`}
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
