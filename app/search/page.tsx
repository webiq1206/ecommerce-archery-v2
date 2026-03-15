import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { db, productsTable, productImagesTable, brandsTable, reviewsTable } from "@/lib/db";
import { eq, and, asc, desc, sql } from "drizzle-orm";
import { ProductCard } from "@/components/ProductCard";
import { SearchForm } from "@/components/SearchForm";
import { NoResults } from "@/components/catalog/NoResults";
import { SearchControls } from "@/components/search/SearchControls";
import { SchemaOrg } from "@/components/seo/SchemaOrg";
import { breadcrumbSchema } from "@/lib/seo/schemas";
import { SearchTracker } from "@/components/analytics/SearchTracker";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  return {
    title: q ? `Search results for "${q}"` : "Search",
    description: q ? `Search results for "${q}" at Apex Archery.` : "Search for archery gear, bows, arrows, and accessories.",
    robots: "noindex, follow",
  };
}

async function searchProducts(
  q: string,
  page: number = 1,
  sort: string = "relevance",
  selectedBrands: string[] = []
) {
  const limit = 24;
  const offset = (page - 1) * limit;
  const searchCondition = sql`(${productsTable.searchVector} @@ websearch_to_tsquery('english', ${q}) OR ${productsTable.name} ILIKE ${"%" + q + "%"})`;

  const baseConditions = [eq(productsTable.status, "ACTIVE"), searchCondition];
  const conditions =
    selectedBrands.length > 0
      ? [...baseConditions, sql`${productsTable.brandId} IN ${selectedBrands}`]
      : baseConditions;

  const baseWhere = and(...baseConditions);
  const where = and(...conditions);

  const rankExpr = sql`ts_rank(${productsTable.searchVector}, websearch_to_tsquery('english', ${q}))`;
  const orderBy =
    sort === "price-asc"
      ? asc(productsTable.price)
      : sort === "price-desc"
        ? desc(productsTable.price)
        : sort === "newest"
          ? desc(productsTable.createdAt)
          : desc(rankExpr);

  const [products, countResult, availableBrands] = await Promise.all([
    db.select().from(productsTable).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(productsTable).where(where),
    db
      .selectDistinct({ id: brandsTable.id, name: brandsTable.name })
      .from(productsTable)
      .innerJoin(brandsTable, eq(productsTable.brandId, brandsTable.id))
      .where(baseWhere)
      .orderBy(asc(brandsTable.name)),
  ]);

  const total = countResult[0]?.count ?? 0;
  const productIds = products.map((p) => p.id);

  const [images, brands, reviews] = await Promise.all([
    productIds.length > 0
      ? db.select().from(productImagesTable).where(sql`${productImagesTable.productId} IN ${productIds}`).orderBy(asc(productImagesTable.sortOrder))
      : [],
    (() => {
      const brandIds = [...new Set(products.map((p) => p.brandId).filter(Boolean))];
      return brandIds.length > 0
        ? db.select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug }).from(brandsTable).where(sql`${brandsTable.id} IN ${brandIds}`)
        : [];
    })(),
    productIds.length > 0
      ? db.select({ productId: reviewsTable.productId, count: sql<number>`count(*)::int` }).from(reviewsTable).where(and(sql`${reviewsTable.productId} IN ${productIds}`, eq(reviewsTable.isApproved, true))).groupBy(reviewsTable.productId)
      : [],
  ]);

  const imageMap = new Map<string, any[]>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, []);
    imageMap.get(img.productId)!.push(img);
  }
  const brandMap = new Map(brands.map((b) => [b.id, b]));
  const reviewMap = new Map(reviews.map((r) => [r.productId, r.count]));

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
      reviewCount: reviewMap.get(p.id) ?? 0,
    })),
    total,
    totalPages: Math.ceil(total / limit),
    availableBrands,
  };
}

const suggestedCategories = [
  { name: "Compound Bows", href: "/categories/bows/compound" },
  { name: "Recurve Bows", href: "/categories/bows/recurve" },
  { name: "Arrows", href: "/categories/arrows" },
  { name: "Accessories", href: "/categories/accessories" },
  { name: "Hunting Gear", href: "/categories/hunting" },
  { name: "Targets", href: "/categories/targets" },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; sort?: string; brands?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));
  const sort = sp.sort ?? "relevance";
  const selectedBrands = sp.brands ? sp.brands.split(",").filter(Boolean) : [];
  const data = q ? await searchProducts(q, page, sort, selectedBrands) : null;

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://apexarchery.com";
  const searchBreadcrumb = breadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Search", url: "/search" },
      ...(q ? [{ name: q, url: `/search?q=${encodeURIComponent(q)}` }] : []),
    ],
    BASE_URL
  );

  return (
    <div>
      <SchemaOrg data={searchBreadcrumb} />
      {q && <SearchTracker query={q} resultCount={data?.total ?? 0} />}
      <div className="bg-background pt-28 pb-12 border-b border-border">
        <div className="max-w-3xl mx-auto px-4">
          <nav className="flex items-center gap-1.5 text-xs text-white/40 mb-6 justify-center">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">Search</span>
            {q && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/60">&quot;{q}&quot;</span>
              </>
            )}
          </nav>
          <h1 className="font-display text-4xl font-normal text-center mb-8 text-white">
            {q ? `Search results for "${q}"` : "Search"}
          </h1>
          <SearchForm initialQuery={q} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {q && data && (
          <>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/40">
                {data.total} result{data.total !== 1 ? "s" : ""} for &quot;{q}&quot;
              </p>
            </div>
            {data.products.length > 0 && (
              <SearchControls
                brands={data.availableBrands}
                currentSort={sort}
                selectedBrands={selectedBrands}
                query={q}
              />
            )}
          </>
        )}

        {data && data.products.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {data.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/search?q=${encodeURIComponent(q)}&page=${p}${sort !== "relevance" ? `&sort=${sort}` : ""}${selectedBrands.length > 0 ? `&brands=${selectedBrands.join(",")}` : ""}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      p === page ? "bg-primary text-primary-foreground" : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </>
        ) : q && data ? (
          <NoResults query={q} />
        ) : !q ? (
          <div className="text-center py-20">
            <p className="text-white/40 text-lg mb-6">Enter a search term to find products</p>
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
        ) : null}
      </div>
    </div>
  );
}
