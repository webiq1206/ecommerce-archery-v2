import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ShieldCheck, Truck, Clock } from "lucide-react";
import { db, productsTable, productImagesTable, brandsTable, reviewsTable } from "@workspace/db";
import { eq, and, asc, sql, desc } from "drizzle-orm";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";

export const metadata: Metadata = {
  title: "Apex Archery | Premium Archery Gear",
  description: "Discover premium archery gear and technical apparel designed for those who demand absolute precision in every shot.",
};

async function getFeaturedProducts() {
  const products = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.status, "ACTIVE"), eq(productsTable.isFeatured, true)))
    .orderBy(desc(productsTable.createdAt))
    .limit(4);

  const productIds = products.map((p) => p.id);
  if (productIds.length === 0) return [];

  const images = await db
    .select()
    .from(productImagesTable)
    .where(sql`${productImagesTable.productId} IN ${productIds}`)
    .orderBy(asc(productImagesTable.sortOrder));

  const brandIds = [...new Set(products.map((p) => p.brandId).filter((id): id is string => id !== null))];
  const brands =
    brandIds.length > 0
      ? await db
          .select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug })
          .from(brandsTable)
          .where(sql`${brandsTable.id} IN ${brandIds}`)
      : [];

  const reviewCounts =
    productIds.length > 0
      ? await db
          .select({ productId: reviewsTable.productId, count: sql<number>`count(*)::int` })
          .from(reviewsTable)
          .where(and(sql`${reviewsTable.productId} IN ${productIds}`, eq(reviewsTable.isApproved, true)))
          .groupBy(reviewsTable.productId)
      : [];

  const imageMap = new Map<string, Array<{ id: string; url: string; altText: string | null; sortOrder: number }>>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, []);
    imageMap.get(img.productId)!.push({ id: img.id, url: img.url, altText: img.altText, sortOrder: img.sortOrder });
  }
  const brandMap = new Map(brands.map((b) => [b.id, b]));
  const reviewMap = new Map(reviewCounts.map((r) => [r.productId, r.count]));

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
    reviewCount: reviewMap.get(p.id) ?? 0,
  }));
}

const categories = [
  { name: "Compound Bows", slug: "compound-bows", imageUrl: "/images/cat-compound-bows.png", description: "Precision-engineered for maximum performance" },
  { name: "Recurve Bows", slug: "recurve-bows", imageUrl: "/images/cat-recurve-bows.png", description: "Traditional craftsmanship meets modern design" },
  { name: "Arrows & Broadheads", slug: "arrows", imageUrl: "/images/cat-arrows.png", description: "Carbon fiber to cut through any conditions" },
  { name: "Performance Apparel", slug: "apparel", imageUrl: "/images/cat-apparel.png", description: "Tactical gear for the serious archer" },
];

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <>
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
        <div className="relative z-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pb-24 md:pb-32">
          <div className="max-w-3xl">
            <span className="inline-block py-1.5 px-4 border border-primary/40 text-primary uppercase tracking-[0.2em] text-xs font-bold mb-8 rounded-full bg-black/30 backdrop-blur-sm">
              Pursue Perfection
            </span>
            <h1 className="font-display text-5xl sm:text-6xl md:text-8xl font-bold leading-[0.95] mb-8 text-white">
              Engineered<br />for the <span className="text-primary italic">Wild.</span>
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
                href="/products?category=compound-bows"
                className="bg-white/10 hover:bg-white/15 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-lg font-semibold text-center transition-all hover:-translate-y-0.5 uppercase tracking-wider text-sm"
              >
                Explore Bows
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-6 border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="flex items-center justify-center gap-3 py-3">
            <Truck className="w-5 h-5 text-primary" />
            <div className="text-left">
              <span className="text-white text-sm font-medium">Free Shipping</span>
              <span className="text-white/30 text-xs ml-2">over $150</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 py-3 md:border-x md:border-white/5">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <div className="text-left">
              <span className="text-white text-sm font-medium">Lifetime Warranty</span>
              <span className="text-white/30 text-xs ml-2">flagship bows</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3 py-3">
            <Clock className="w-5 h-5 text-primary" />
            <div className="text-left">
              <span className="text-white text-sm font-medium">Expert Support</span>
              <span className="text-white/30 text-xs ml-2">tuning & setup</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-14">
          <div>
            <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4 block">Categories</span>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white">Shop by Category</h2>
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
              <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-6 block">Our Story</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold mb-8 leading-tight text-white">
                Built on absolute <span className="text-primary italic">accuracy.</span>
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

      <section className="py-24 md:py-32 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-14">
            <div>
              <span className="text-primary text-xs font-bold tracking-[0.2em] uppercase mb-4 block">New Arrivals</span>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white">Featured Gear</h2>
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
    </>
  );
}
