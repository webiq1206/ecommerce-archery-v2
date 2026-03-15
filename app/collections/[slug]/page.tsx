import type { Metadata } from "next";
import Link from "next/link";
import {
  db,
  collectionsTable,
  productsTable,
  productImagesTable,
  productCollectionsTable,
  productVariantsTable,
  brandsTable,
  reviewsTable,
} from "@/lib/db";
import { eq, and, sql, asc, desc, gte, lte } from "drizzle-orm";
import { ProductCard } from "@/components/ProductCard";
import { CategoryHero } from "@/components/catalog/CategoryHero";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import { FilterDrawer } from "@/components/catalog/FilterDrawer";
import { ViewToggle } from "@/components/catalog/ViewToggle";
import { notFound } from "next/navigation";
import { SchemaOrg } from "@/components/seo/SchemaOrg";
import { breadcrumbSchema } from "@/lib/seo/schemas";

const PRODUCTS_PER_PAGE = 24;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [collection] = await db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.slug, slug))
    .limit(1);
  if (!collection) return { title: "Collection Not Found" };

  return {
    title: collection.seoTitle ?? `${collection.name} Collection`,
    description: collection.seoDesc ?? `Shop the ${collection.name} collection at Apex Archery.`,
    openGraph: {
      title: collection.name,
      description: collection.seoDesc ?? `Shop ${collection.name} at Apex Archery.`,
      url: `/collections/${slug}`,
      siteName: "Apex Archery",
    },
    alternates: { canonical: `/collections/${slug}` },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const [collection] = await db
    .select()
    .from(collectionsTable)
    .where(eq(collectionsTable.slug, slug))
    .limit(1);

  if (!collection) notFound();

  const collectionProducts = await db
    .select({ productId: productCollectionsTable.productId })
    .from(productCollectionsTable)
    .where(eq(productCollectionsTable.collectionId, collection.id));

  let productIds = collectionProducts.map((r) => r.productId);
  if (productIds.length === 0) productIds = ["___"];

  const conditions: any[] = [
    sql`${productsTable.id} IN ${productIds}`,
    eq(productsTable.status, "ACTIVE"),
  ];

  const minPrice = sp.minPrice ? String(sp.minPrice) : null;
  const maxPrice = sp.maxPrice ? String(sp.maxPrice) : null;
  if (minPrice) conditions.push(gte(productsTable.price, minPrice));
  if (maxPrice) conditions.push(lte(productsTable.price, maxPrice));

  const brandSlugs = typeof sp.brand === "string" ? [sp.brand] : Array.isArray(sp.brand) ? sp.brand : [];
  if (brandSlugs.length > 0) {
    const brandRows = await db
      .select({ id: brandsTable.id })
      .from(brandsTable)
      .where(sql`${brandsTable.slug} IN ${brandSlugs}`);
    const brandIds = brandRows.map((b) => b.id);
    if (brandIds.length > 0) {
      conditions.push(sql`${productsTable.brandId} IN ${brandIds}`);
    }
  }

  // In-stock filter via variant inventory
  if (sp.inStock === "true") {
    const inStockProducts = await db
      .select({ productId: productVariantsTable.productId })
      .from(productVariantsTable)
      .where(sql`${productVariantsTable.inventory} > 0`)
      .groupBy(productVariantsTable.productId);
    const inStockIds = inStockProducts.map((r) => r.productId);
    if (inStockIds.length > 0) {
      conditions.push(sql`${productsTable.id} IN ${inStockIds}`);
    } else {
      conditions.push(sql`1 = 0`);
    }
  }

  // Hand orientation filter via variant options
  const handFilter = typeof sp.hand === "string" ? sp.hand : null;
  if (handFilter) {
    const handVariants = await db
      .select({ productId: productVariantsTable.productId })
      .from(productVariantsTable)
      .where(sql`${productVariantsTable.options}::text ILIKE ${"%" + handFilter + "%"}`)
      .groupBy(productVariantsTable.productId);
    const handProductIds = handVariants.map((r) => r.productId);
    if (handProductIds.length > 0) {
      conditions.push(sql`${productsTable.id} IN ${handProductIds}`);
    } else {
      conditions.push(sql`1 = 0`);
    }
  }

  // Draw weight filter
  const dwMin = sp.drawWeightMin ? String(sp.drawWeightMin) : null;
  const dwMax = sp.drawWeightMax ? String(sp.drawWeightMax) : null;
  if (dwMin || dwMax) {
    const allVariants = await db
      .select({ productId: productVariantsTable.productId, options: productVariantsTable.options })
      .from(productVariantsTable);
    const matchingProductIds = new Set<string>();
    for (const v of allVariants) {
      if (!v.options) continue;
      for (const [key, val] of Object.entries(v.options as Record<string, string>)) {
        if (key.toLowerCase().includes("weight")) {
          const num = parseFloat(val.replace(/[^0-9.]/g, ""));
          if (!isNaN(num)) {
            const minOk = !dwMin || num >= parseFloat(dwMin);
            const maxOk = !dwMax || num <= parseFloat(dwMax);
            if (minOk && maxOk) matchingProductIds.add(v.productId);
          }
        }
      }
    }
    if (matchingProductIds.size > 0) {
      conditions.push(sql`${productsTable.id} IN ${[...matchingProductIds]}`);
    } else {
      conditions.push(sql`1 = 0`);
    }
  }

  const sort = String(sp.sort ?? "newest");
  let orderBy: any = desc(productsTable.createdAt);
  if (sort === "price-asc") orderBy = asc(productsTable.price);
  if (sort === "price-desc") orderBy = desc(productsTable.price);

  const page = Math.max(1, parseInt(String(sp.page ?? "1"), 10));

  const products = await db
    .select()
    .from(productsTable)
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(PRODUCTS_PER_PAGE)
    .offset((page - 1) * PRODUCTS_PER_PAGE);

  const totalCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(and(...conditions));

  const total = totalCount[0]?.count ?? 0;

  const pIds = products.map((p) => p.id);
  const [images, brands, reviews] = await Promise.all([
    pIds.length > 0
      ? db.select().from(productImagesTable).where(sql`${productImagesTable.productId} IN ${pIds}`).orderBy(asc(productImagesTable.sortOrder))
      : [],
    db.select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug }).from(brandsTable).where(eq(brandsTable.isActive, true)),
    pIds.length > 0
      ? db.select({ productId: reviewsTable.productId, count: sql<number>`count(*)::int` }).from(reviewsTable).where(and(sql`${reviewsTable.productId} IN ${pIds}`, eq(reviewsTable.isApproved, true))).groupBy(reviewsTable.productId)
      : [],
  ]);

  const imageMap = new Map<string, (typeof images)[number][]>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, []);
    imageMap.get(img.productId)!.push(img);
  }
  const brandMap = new Map(brands.map((b) => [b.id, b] as const));
  const reviewMap = new Map(reviews.map((r) => [r.productId, r.count] as const));

  const enrichedProducts = products.map((p) => ({
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

  const drawWeightMin = sp.drawWeightMin ? String(sp.drawWeightMin) : null;
  const drawWeightMax = sp.drawWeightMax ? String(sp.drawWeightMax) : null;
  const activeFilterCount =
    brandSlugs.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0) +
    (sp.inStock === "true" ? 1 : 0) +
    (sp.hand ? 1 : 0) +
    (drawWeightMin ? 1 : 0) +
    (drawWeightMax ? 1 : 0);

  const viewMode = String(sp.view ?? "grid") as "grid" | "list";
  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);
  const collectionBasePath = `/collections/${slug}`;

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://apexarchery.com";
  const collectionBreadcrumb = breadcrumbSchema(
    [
      { name: "Home", url: "/" },
      { name: "Collections", url: "/collections" },
      { name: collection.name, url: `/collections/${slug}` },
    ],
    BASE_URL
  );

  return (
    <div>
      <SchemaOrg data={collectionBreadcrumb} />
      <CategoryHero
        name={collection.name}
        description={collection.description}
        imageUrl={collection.imageUrl}
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Collections", href: "/collections" }]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6 lg:hidden">
          <span className="text-sm text-white/40">{total} products</span>
          <FilterDrawer
            brands={brands}
            subcategories={[]}
            categorySlug={slug}
            totalProducts={total}
            activeFilterCount={activeFilterCount}
            basePath={collectionBasePath}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
          <div className="hidden lg:block">
            <FilterPanel brands={brands} subcategories={[]} categorySlug={slug} totalProducts={total} basePath={collectionBasePath} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-white/40">{total} products</span>
              <ViewToggle currentView={viewMode} />
            </div>
            <div className={viewMode === "list" ? "space-y-4" : "grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10"}>
              {enrichedProducts.map((product) => (
                <ProductCard key={product.id} product={product} mode={viewMode} />
              ))}
            </div>
            {enrichedProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-white/40 text-lg">No products in this collection yet</p>
              </div>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`?${new URLSearchParams({ ...sp as any, page: String(p) }).toString()}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      p === page ? "bg-primary text-primary-foreground" : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
