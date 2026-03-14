import type { Metadata } from "next";
import Link from "next/link";
import { db, productsTable, productImagesTable, brandsTable, reviewsTable } from "@workspace/db";
import { eq, and, asc, desc, sql, gte, lte } from "drizzle-orm";
import { ProductCard } from "@/components/ProductCard";
import { SearchForm } from "@/components/SearchForm";

export const metadata: Metadata = {
  title: "Search",
  description: "Search for archery gear, bows, arrows, and accessories.",
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

async function searchProducts(q: string, page: number = 1) {
  const limit = 24;
  const offset = (page - 1) * limit;

  const conditions = [
    eq(productsTable.status, "ACTIVE"),
    sql`(
      ${productsTable.searchVector} @@ websearch_to_tsquery('english', ${q})
      OR ${productsTable.name} ILIKE ${"%" + q + "%"}
    )`,
  ];

  const where = and(...conditions);
  const rankExpr = sql`ts_rank(${productsTable.searchVector}, websearch_to_tsquery('english', ${q}))`;

  const [products, countResult] = await Promise.all([
    db.select().from(productsTable).where(where).orderBy(desc(rankExpr)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const productIds = products.map((p) => p.id);

  const images = productIds.length > 0 ? await db.select().from(productImagesTable).where(sql`${productImagesTable.productId} IN ${productIds}`).orderBy(asc(productImagesTable.sortOrder)) : [];
  const brandIds = [...new Set(products.map((p) => p.brandId).filter((id): id is string => id !== null))];
  const brands = brandIds.length > 0 ? await db.select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug }).from(brandsTable).where(sql`${brandsTable.id} IN ${brandIds}`) : [];

  const imageMap = new Map<string, Array<{ id: string; url: string; altText: string | null; sortOrder: number }>>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, []);
    imageMap.get(img.productId)!.push({ id: img.id, url: img.url, altText: img.altText, sortOrder: img.sortOrder });
  }
  const brandMap = new Map(brands.map((b) => [b.id, b]));

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      isFeatured: p.isFeatured,
      isNewArrival: p.isNewArrival,
      images: imageMap.get(p.id) ?? [],
      brand: p.brandId ? brandMap.get(p.brandId) ?? null : null,
    })),
    total,
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = params.q ?? "";
  const data = q ? await searchProducts(q, Number(params.page) || 1) : null;

  return (
    <>
      <div className="bg-background pt-28 pb-12 border-b border-border">
        <div className="max-w-3xl mx-auto px-4">
          <h1 className="font-display text-4xl font-normal text-center mb-8 text-white">Search</h1>
          <SearchForm initialQuery={q} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {q && (
          <p className="text-muted-foreground mb-8">
            {data ? `${data.total} results for "${q}"` : "Searching..."}
          </p>
        )}

        {data && data.products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : q && data ? (
          <div className="text-center py-20">
            <p className="text-xl text-muted-foreground mb-4">No products found for &quot;{q}&quot;</p>
            <Link href="/products" className="text-primary font-medium hover:underline">
              Browse all products
            </Link>
          </div>
        ) : null}
      </div>
    </>
  );
}
