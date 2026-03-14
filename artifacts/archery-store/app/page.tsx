import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ShieldCheck, Truck, Clock } from "lucide-react";
import { db, productsTable, productImagesTable, brandsTable, reviewsTable } from "@workspace/db";
import { eq, and, asc, sql, desc } from "drizzle-orm";
import { ProductCard } from "@/components/ProductCard";

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
  { name: "Compound Bows", slug: "compound-bows" },
  { name: "Arrows & Broadheads", slug: "arrows" },
  { name: "Performance Apparel", slug: "apparel" },
];

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <>
      <section className="relative h-[85vh] w-full flex items-center justify-center overflow-hidden bg-secondary">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
          <div className="w-full h-full bg-gradient-to-br from-secondary via-secondary/80 to-primary/20" />
        </div>
        <div className="relative z-20 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="max-w-2xl text-white">
            <span className="inline-block py-1 px-3 border border-primary/50 text-primary uppercase tracking-widest text-xs font-bold mb-6 rounded-full bg-primary/10 backdrop-blur-sm">
              Pursue Perfection
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.1] mb-6">
              Engineered for the <br /> <span className="text-primary italic">Wild.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-xl font-light">
              Discover premium archery gear and technical apparel designed for those who demand absolute precision in every shot.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-xl font-semibold text-center transition-all hover:scale-105 shadow-lg shadow-primary/25"
              >
                Shop All Gear
              </Link>
              <Link
                href="/products?category=compound-bows"
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/30 px-8 py-4 rounded-xl font-semibold text-center transition-all"
              >
                Explore Bows
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary text-secondary-foreground py-8 border-y border-secondary-foreground/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-secondary-foreground/20">
          <div className="flex flex-col items-center gap-3 pt-4 md:pt-0">
            <Truck className="w-8 h-8 text-primary" />
            <div>
              <h4 className="font-bold tracking-wide">Free Shipping</h4>
              <p className="text-sm text-secondary-foreground/70">On all orders over $150</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 pt-4 md:pt-0">
            <ShieldCheck className="w-8 h-8 text-primary" />
            <div>
              <h4 className="font-bold tracking-wide">Lifetime Warranty</h4>
              <p className="text-sm text-secondary-foreground/70">On select flagship bows</p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-3 pt-4 md:pt-0">
            <Clock className="w-8 h-8 text-primary" />
            <div>
              <h4 className="font-bold tracking-wide">Expert Support</h4>
              <p className="text-sm text-secondary-foreground/70">Tuning & setup advice</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="font-display text-4xl font-bold mb-4">Shop by Category</h2>
            <p className="text-muted-foreground text-lg">Equipment for every discipline.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="group relative aspect-square rounded-3xl overflow-hidden bg-secondary"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-secondary via-primary/10 to-secondary/80 transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
                <h3 className="text-white font-display text-2xl font-bold mb-2">{cat.name}</h3>
                <span className="text-primary font-medium flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                  Explore <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-display text-4xl font-bold mb-4">Featured Gear</h2>
              <p className="text-muted-foreground text-lg">Top tier performance selected by pros.</p>
            </div>
            <Link href="/products" className="hidden sm:flex items-center gap-2 text-primary font-medium hover:underline">
              View all products <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-secondary" />
          <div className="max-w-xl">
            <h2 className="font-display text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Built on the foundation of absolute <span className="text-primary italic">accuracy</span>.
            </h2>
            <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
              We don&apos;t just sell gear; we field-test every bow, arrow, and accessory in the harshest conditions. Our curated selection represents the pinnacle of modern archery technology.
            </p>
            <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
              Whether you&apos;re packing out for a backcountry elk hunt or stepping up to the 3D target line, we provide the confidence that your equipment will perform flawlessly when the moment arrives.
            </p>
            <Link href="/guides" className="inline-flex items-center gap-2 border-b-2 border-primary text-primary font-bold pb-1 hover:text-primary/80 transition-colors">
              Read our gear guides <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
