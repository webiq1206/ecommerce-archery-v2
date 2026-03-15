import Link from "next/link";
import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Truck, Clock } from "lucide-react";
import {
  db,
  productsTable,
  productImagesTable,
  brandsTable,
  reviewsTable,
  collectionsTable,
  buyingGuidesTable,
  blogPostsTable,
  categoriesTable,
} from "@workspace/db";
import { eq, and, asc, sql, desc } from "drizzle-orm";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import { OpenAIButton } from "@/components/ai/OpenAIButton";

export const metadata: Metadata = {
  title: "Apex Archery | Premium Archery Gear",
  description:
    "Discover premium archery gear and technical apparel designed for those who demand absolute precision in every shot.",
  openGraph: {
    type: "website",
    siteName: "Apex Archery",
    title: "Apex Archery | Premium Archery Gear",
    description:
      "Discover premium archery gear and technical apparel designed for those who demand absolute precision in every shot.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Apex Archery | Premium Archery Gear",
    description:
      "Discover premium archery gear and technical apparel designed for those who demand absolute precision in every shot.",
  },
};

async function getProductsWithRelations(
  where: ReturnType<typeof and>,
  orderBy: any,
  limit: number
) {
  const products = await db
    .select()
    .from(productsTable)
    .where(where)
    .orderBy(orderBy)
    .limit(limit);

  if (products.length === 0) return [];

  const productIds = products.map((p) => p.id);
  const [images, brands, reviewCounts] = await Promise.all([
    db
      .select()
      .from(productImagesTable)
      .where(sql`${productImagesTable.productId} IN ${productIds}`)
      .orderBy(asc(productImagesTable.sortOrder)),
    db
      .select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug })
      .from(brandsTable)
      .where(
        sql`${brandsTable.id} IN ${[
          ...new Set(products.map((p) => p.brandId).filter(Boolean)),
          "___",
        ]}`
      ),
    db
      .select({
        productId: reviewsTable.productId,
        count: sql<number>`count(*)::int`,
        avgRating: sql<number>`avg(${reviewsTable.rating})::numeric(3,2)`,
      })
      .from(reviewsTable)
      .where(
        and(
          sql`${reviewsTable.productId} IN ${productIds}`,
          eq(reviewsTable.isApproved, true)
        )
      )
      .groupBy(reviewsTable.productId),
  ]);

  const imageMap = new Map<string, Array<{ id: string; url: string; altText: string | null; sortOrder: number }>>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, []);
    imageMap.get(img.productId)!.push(img);
  }
  const brandMap = new Map(brands.map((b) => [b.id, b]));
  const reviewMap = new Map(reviewCounts.map((r) => [r.productId, { count: r.count, avg: r.avgRating }]));

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    isFeatured: p.isFeatured,
    isNewArrival: p.isNewArrival,
    images: imageMap.get(p.id) ?? [],
    brand: p.brandId ? brandMap.get(p.brandId) ?? null : null,
    reviewCount: reviewMap.get(p.id)?.count ?? 0,
    rating: reviewMap.get(p.id)?.avg ?? 0,
  }));
}

export default async function HomePage() {
  const [featuredProducts, newArrivals, dbCategories, featuredCollections, latestGuides, latestPosts] =
    await Promise.all([
      getProductsWithRelations(
        and(eq(productsTable.status, "ACTIVE"), eq(productsTable.isFeatured, true)),
        desc(productsTable.createdAt),
        8
      ),
      getProductsWithRelations(
        and(eq(productsTable.status, "ACTIVE"), eq(productsTable.isNewArrival, true)),
        desc(productsTable.createdAt),
        8
      ),
      db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.isActive, true))
        .orderBy(asc(categoriesTable.sortOrder))
        .limit(4),
      db
        .select()
        .from(collectionsTable)
        .where(eq(collectionsTable.isActive, true))
        .orderBy(asc(collectionsTable.sortOrder))
        .limit(6),
      db
        .select()
        .from(buyingGuidesTable)
        .where(eq(buyingGuidesTable.status, "PUBLISHED"))
        .orderBy(desc(buyingGuidesTable.publishedAt))
        .limit(3),
      db
        .select()
        .from(blogPostsTable)
        .where(eq(blogPostsTable.status, "PUBLISHED"))
        .orderBy(desc(blogPostsTable.publishedAt))
        .limit(3),
    ]);

  const categories =
    dbCategories.length > 0
      ? dbCategories.map((c) => ({
          name: c.name,
          slug: c.slug,
          description: c.description ?? "",
          imageUrl: c.imageUrl ?? "/images/cat-compound-bows.png",
        }))
      : [
          { name: "Compound Bows", slug: "compound-bows", imageUrl: "/images/cat-compound-bows.png", description: "Precision-engineered for maximum performance" },
          { name: "Recurve Bows", slug: "recurve-bows", imageUrl: "/images/cat-recurve-bows.png", description: "Traditional craftsmanship meets modern design" },
          { name: "Arrows & Broadheads", slug: "arrows", imageUrl: "/images/cat-arrows.png", description: "Carbon fiber to cut through any conditions" },
          { name: "Performance Apparel", slug: "apparel", imageUrl: "/images/cat-apparel.png", description: "Tactical gear for the serious archer" },
        ];

  return (
    <>
      {/* Hero */}
      <section className="relative h-screen w-full flex items-end overflow-hidden">
        <div className="absolute inset-0 z-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero.png"
            alt="Archer in misty forest"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
        </div>
        <div id="hero-sentinel" className="absolute bottom-0 h-1 w-full" />
        <div className="relative z-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-32">
          <div className="max-w-3xl">
            <span className="inline-block py-1.5 px-4 border border-white/20 text-secondary-foreground uppercase tracking-[0.2em] text-xs font-bold mb-8 rounded-full bg-black/30 backdrop-blur-sm">
              Pursue Perfection
            </span>
            <h1 className="font-display text-5xl sm:text-6xl md:text-8xl font-normal leading-[0.95] mb-8 text-white">
              Engineered<br />for the <span className="text-primary">Wild.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/60 mb-12 max-w-xl font-light leading-relaxed">
              Premium archery gear and technical apparel for those who demand absolute precision in every shot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-4 rounded-lg font-semibold text-center transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20 uppercase tracking-wider text-sm"
              >
                Shop All Gear
              </Link>
              <Link
                href="/categories/bows/compound"
                className="bg-white/10 hover:bg-white/15 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-lg font-semibold text-center transition-all hover:-translate-y-0.5 uppercase tracking-wider text-sm"
              >
                Explore Bows
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="bg-background py-6 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex items-center justify-center gap-3 py-3">
            <Truck className="w-5 h-5 text-primary" />
            <div className="text-left">
              <span className="text-white text-sm font-medium">Free Shipping</span>
              <span className="text-white/30 text-xs ml-2">over $99</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 py-3 md:border-x md:border-white/5">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div className="text-left">
              <span className="text-white text-sm font-medium">30-Day Returns</span>
              <span className="text-white/30 text-xs ml-2">hassle-free</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 py-3">
            <Clock className="w-5 h-5 text-primary" />
            <div className="text-left">
              <span className="text-white text-sm font-medium">Expert Support</span>
              <span className="text-white/30 text-xs ml-2">archery pros</span>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 md:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-14">
          <div>
            <span className="text-secondary-foreground text-xs font-bold tracking-[0.2em] uppercase mb-4 block">Categories</span>
            <h2 className="font-display text-4xl md:text-5xl font-normal text-white">Shop by Category</h2>
          </div>
          <Link href="/products" className="hidden sm:flex items-center gap-2 text-primary font-medium text-sm uppercase tracking-wider hover:text-primary/80 transition-colors">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <CategoryCard key={cat.slug} category={cat} />
          ))}
        </div>
      </section>

      {/* Collections */}
      {featuredCollections.length > 0 && (
        <section className="py-24 md:py-32 bg-[#0D0D0D]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-14">
              <div>
                <span className="text-secondary-foreground text-xs font-bold tracking-[0.2em] uppercase mb-4 block">Curated</span>
                <h2 className="font-display text-4xl md:text-5xl font-normal text-white">Shop Collections</h2>
              </div>
              <Link href="/collections" className="hidden sm:flex items-center gap-2 text-primary font-medium text-sm uppercase tracking-wider hover:text-primary/80 transition-colors">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCollections.map((col) => (
                <Link
                  key={col.id}
                  href={`/collections/${col.slug}`}
                  className="group relative aspect-[4/3] rounded-2xl overflow-hidden"
                >
                  {col.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={col.imageUrl} alt={col.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-display text-xl text-white group-hover:text-primary transition-colors normal-case">{col.name}</h3>
                    {col.description && <p className="text-sm text-white/50 mt-1 line-clamp-2">{col.description}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand Story */}
      <section className="relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
          <div className="relative h-[60vh] lg:h-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/brand-story.png"
              alt="Archer in wilderness at golden hour"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/20" />
          </div>
          <div className="flex items-center bg-background px-8 md:px-16 lg:px-20 py-20">
            <div className="max-w-lg">
              <span className="text-secondary-foreground text-xs font-bold tracking-[0.2em] uppercase mb-6 block">Our Story</span>
              <h2 className="font-display text-4xl md:text-5xl font-normal mb-8 leading-tight text-white">
                Built on absolute <span className="text-primary">accuracy.</span>
              </h2>
              <p className="text-lg text-white/50 mb-6 leading-relaxed">
                We don&apos;t just sell gear; we field-test every bow, arrow, and accessory in the harshest conditions. Our curated selection represents the pinnacle of modern archery technology.
              </p>
              <p className="text-lg text-white/50 mb-10 leading-relaxed">
                Whether you&apos;re packing out for a backcountry elk hunt or stepping up to the 3D target line, we provide the confidence that your equipment will perform flawlessly.
              </p>
              <Link href="/guides" className="inline-flex items-center gap-3 text-primary font-medium uppercase tracking-wider text-sm group">
                Read our gear guides <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Banner */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/catalog-banner.png"
          alt="Premium archery equipment close-up"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center max-w-2xl px-4">
          <h2 className="font-display text-4xl md:text-6xl font-normal text-white mb-4">Precision Starts Here</h2>
          <p className="text-white/60 text-lg mb-8">Shop our complete collection of competition-grade bows, arrows, and accessories.</p>
          <Link
            href="/products"
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-4 rounded-md font-semibold text-center transition-all hover:-translate-y-0.5 shadow-lg shadow-primary/20 uppercase tracking-wider text-sm inline-block"
          >
            Shop Now
          </Link>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 md:py-32 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-14">
            <div>
              <span className="text-secondary-foreground text-xs font-bold tracking-[0.2em] uppercase mb-4 block">Featured</span>
              <h2 className="font-display text-4xl md:text-5xl font-normal text-white">Featured Gear</h2>
            </div>
            <Link href="/products" className="hidden sm:flex items-center gap-2 text-primary font-medium text-sm uppercase tracking-wider hover:text-primary/80 transition-colors">
              View all products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {featuredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-white/30 text-lg">Seed the database to see featured products here.</p>
              <p className="text-white/20 text-sm mt-2">Run: npx tsx scripts/seed.ts</p>
            </div>
          )}
        </div>
      </section>

      {/* New Arrivals */}
      {newArrivals.length > 0 && (
        <section className="py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-14">
              <div>
                <span className="text-secondary-foreground text-xs font-bold tracking-[0.2em] uppercase mb-4 block">Just In</span>
                <h2 className="font-display text-4xl md:text-5xl font-normal text-white">New Arrivals</h2>
              </div>
              <Link href="/products?sort=newest" className="hidden sm:flex items-center gap-2 text-primary font-medium text-sm uppercase tracking-wider hover:text-primary/80 transition-colors">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-12">
              {newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Guides & Blog */}
      {(latestGuides.length > 0 || latestPosts.length > 0) && (
        <section className="py-24 md:py-32 bg-[#0D0D0D]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="text-secondary-foreground text-xs font-bold tracking-[0.2em] uppercase mb-4 block">Resources</span>
              <h2 className="font-display text-4xl md:text-5xl font-normal text-white">Guides & Education</h2>
              <p className="text-white/40 mt-4 text-sm">
                Not sure what you need?{" "}
                <OpenAIButton label="Ask our AI Advisor" variant="inline" />
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {latestGuides.map((guide) => (
                <Link key={guide.id} href={`/guides/${guide.slug}`} className="group block bg-card rounded-xl overflow-hidden">
                  {guide.coverImage && (
                    <div className="aspect-video overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={guide.coverImage} alt={guide.coverAlt ?? guide.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                  )}
                  <div className="p-6">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-primary">Buying Guide</span>
                    <h3 className="font-display text-lg text-white mt-2 group-hover:text-primary transition-colors normal-case">{guide.title}</h3>
                    {guide.excerpt && <p className="text-sm text-white/40 mt-2 line-clamp-2">{guide.excerpt}</p>}
                  </div>
                </Link>
              ))}
              {latestPosts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="group block bg-card rounded-xl overflow-hidden">
                  {post.coverImage && (
                    <div className="aspect-video overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={post.coverImage} alt={post.coverAlt ?? post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                  )}
                  <div className="p-6">
                    <span className="text-[10px] font-bold tracking-wider uppercase text-primary">Blog</span>
                    <h3 className="font-display text-lg text-white mt-2 group-hover:text-primary transition-colors normal-case">{post.title}</h3>
                    {post.excerpt && <p className="text-sm text-white/40 mt-2 line-clamp-2">{post.excerpt}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
