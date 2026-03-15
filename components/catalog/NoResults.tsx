import Link from "next/link";
import { db, productsTable, productImagesTable, brandsTable } from "@/lib/db";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { ProductCard } from "@/components/ProductCard";

const suggestedCategories = [
  { name: "Compound Bows", href: "/categories/bows/compound" },
  { name: "Recurve Bows", href: "/categories/bows/recurve" },
  { name: "Arrows", href: "/categories/arrows" },
  { name: "Accessories", href: "/categories/accessories" },
  { name: "Hunting Gear", href: "/categories/hunting" },
  { name: "Targets", href: "/categories/targets" },
];

async function getFeaturedProducts() {
  const products = await db
    .select()
    .from(productsTable)
    .where(and(eq(productsTable.status, "ACTIVE"), eq(productsTable.isFeatured, true)))
    .orderBy(desc(productsTable.createdAt))
    .limit(4);

  if (products.length === 0) return [];

  const productIds = products.map((p) => p.id);

  const [images, brands] = await Promise.all([
    db
      .select()
      .from(productImagesTable)
      .where(sql`${productImagesTable.productId} IN ${productIds}`)
      .orderBy(asc(productImagesTable.sortOrder)),
    (() => {
      const brandIds = [...new Set(products.map((p) => p.brandId).filter(Boolean))];
      return brandIds.length > 0
        ? db
            .select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug })
            .from(brandsTable)
            .where(sql`${brandsTable.id} IN ${brandIds}`)
        : [];
    })(),
  ]);

  const imageMap = new Map<string, (typeof images)[number][]>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, []);
    imageMap.get(img.productId)!.push(img);
  }
  const brandMap = new Map(brands.map((b) => [b.id, b] as const));

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
    reviewCount: 0,
  }));
}

export async function NoResults({ query }: { query: string }) {
  const featuredProducts = await getFeaturedProducts();

  return (
    <div className="py-16">
      <div className="text-center mb-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-6">
          <svg className="w-7 h-7 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
        </div>
        <p className="text-xl text-white/50 mb-3">
          No results found for &quot;{query}&quot;
        </p>
        <p className="text-white/30 text-sm mb-10">
          Try a different search term or browse by category
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {suggestedCategories.map((cat) => (
            <Link
              key={cat.href}
              href={cat.href}
              className="px-5 py-2.5 text-sm font-medium rounded-lg border border-white/10 text-white/60 hover:border-primary hover:text-primary transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {featuredProducts.length > 0 && (
        <div>
          <h2 className="font-display text-2xl text-white text-center mb-8">
            Featured Products
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      <div className="text-center mt-12">
        <Link
          href="/products"
          className="inline-flex items-center px-8 py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold uppercase tracking-wider text-sm hover:bg-primary/90 transition-colors"
        >
          Browse All Products
        </Link>
      </div>
    </div>
  );
}
