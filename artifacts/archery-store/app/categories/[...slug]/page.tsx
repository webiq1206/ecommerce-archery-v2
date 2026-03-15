import type { Metadata } from "next";
import Link from "next/link";
import {
  db,
  categoriesTable,
  productsTable,
  productImagesTable,
  productCategoriesTable,
  productVariantsTable,
  brandsTable,
  reviewsTable,
} from "@workspace/db";
import { eq, and, sql, asc, desc, gte, lte, inArray } from "drizzle-orm";
import { ProductCard } from "@/components/ProductCard";
import { CategoryHero } from "@/components/catalog/CategoryHero";
import { SubcategoryLinks } from "@/components/catalog/SubcategoryLinks";
import { FilterPanel } from "@/components/catalog/FilterPanel";
import { FilterDrawer } from "@/components/catalog/FilterDrawer";
import { ViewToggle } from "@/components/catalog/ViewToggle";
import { notFound } from "next/navigation";
import { OpenAIButton } from "@/components/ai/OpenAIButton";
import { SchemaOrg } from "@/components/seo/SchemaOrg";
import { breadcrumbSchema } from "@/lib/seo/schemas";

const PRODUCTS_PER_PAGE = 24;

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
  const { slug } = await params;
  const categorySlug = slug[slug.length - 1];
  const category = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, categorySlug))
    .limit(1);
  if (!category[0]) return { title: "Category Not Found" };

  return {
    title: category[0].seoTitle ?? `${category[0].name} | Shop Archery Gear`,
    description: category[0].seoDesc ?? `Browse our selection of ${category[0].name.toLowerCase()}. Premium archery gear at Apex Archery.`,
    openGraph: {
      title: category[0].seoTitle ?? category[0].name,
      description: category[0].seoDesc ?? `Browse ${category[0].name} at Apex Archery.`,
      url: `/categories/${slug.join("/")}`,
      siteName: "Apex Archery",
    },
    alternates: { canonical: `/categories/${slug.join("/")}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const categorySlug = slug[slug.length - 1];

  const [categoryResult] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.slug, categorySlug))
    .limit(1);

  if (!categoryResult) notFound();

  const subcategories = await db
    .select({ id: categoriesTable.id, name: categoriesTable.name, slug: categoriesTable.slug })
    .from(categoriesTable)
    .where(and(eq(categoriesTable.parentId, categoryResult.id), eq(categoriesTable.isActive, true)))
    .orderBy(asc(categoriesTable.sortOrder));

  const productCatRows = await db
    .select({ productId: productCategoriesTable.productId })
    .from(productCategoriesTable)
    .where(eq(productCategoriesTable.categoryId, categoryResult.id));

  let productIds = productCatRows.map((r) => r.productId);
  if (productIds.length === 0) {
    productIds = ["___"];
  }

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

  // Subcategory filter
  const subSlugs = typeof sp.sub === "string" ? [sp.sub] : Array.isArray(sp.sub) ? sp.sub : [];
  if (subSlugs.length > 0) {
    const subCats = await db
      .select({ id: categoriesTable.id })
      .from(categoriesTable)
      .where(sql`${categoriesTable.slug} IN ${subSlugs}`);
    const subCatIds = subCats.map((c) => c.id);
    if (subCatIds.length > 0) {
      const subProductRows = await db
        .select({ productId: productCategoriesTable.productId })
        .from(productCategoriesTable)
        .where(sql`${productCategoriesTable.categoryId} IN ${subCatIds}`);
      const subProductIds = subProductRows.map((r) => r.productId);
      if (subProductIds.length > 0) {
        conditions.push(sql`${productsTable.id} IN ${subProductIds}`);
      } else {
        conditions.push(sql`1 = 0`);
      }
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
  const drawWeightMin = sp.drawWeightMin ? String(sp.drawWeightMin) : null;
  const drawWeightMax = sp.drawWeightMax ? String(sp.drawWeightMax) : null;
  if (drawWeightMin || drawWeightMax) {
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
            const minOk = !drawWeightMin || num >= parseFloat(drawWeightMin);
            const maxOk = !drawWeightMax || num <= parseFloat(drawWeightMax);
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
  if (sort === "best-sellers") orderBy = desc(productsTable.sortOrder);
  if (sort === "top-rated") orderBy = desc(productsTable.isFeatured);

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
      ? db
          .select()
          .from(productImagesTable)
          .where(sql`${productImagesTable.productId} IN ${pIds}`)
          .orderBy(asc(productImagesTable.sortOrder))
      : [],
    db
      .select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug })
      .from(brandsTable)
      .where(eq(brandsTable.isActive, true)),
    pIds.length > 0
      ? db
          .select({
            productId: reviewsTable.productId,
            count: sql<number>`count(*)::int`,
          })
          .from(reviewsTable)
          .where(and(sql`${reviewsTable.productId} IN ${pIds}`, eq(reviewsTable.isApproved, true)))
          .groupBy(reviewsTable.productId)
      : [],
  ]);

  const imageMap = new Map<string, any[]>();
  for (const img of images) {
    if (!imageMap.has(img.productId)) imageMap.set(img.productId, []);
    imageMap.get(img.productId)!.push(img);
  }
  const brandMap = new Map(brands.map((b) => [b.id, b]));
  const reviewMap = new Map(reviews.map((r) => [r.productId, r.count]));

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

  const breadcrumbs = [{ label: "Home", href: "/" }];
  if (slug.length > 1) {
    for (let i = 0; i < slug.length - 1; i++) {
      breadcrumbs.push({
        label: slug[i].replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        href: `/categories/${slug.slice(0, i + 1).join("/")}`,
      });
    }
  }

  const activeFilterCount = brandSlugs.length + subSlugs.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0) + (sp.inStock === "true" ? 1 : 0) + (sp.hand ? 1 : 0) + (drawWeightMin ? 1 : 0) + (drawWeightMax ? 1 : 0);
  const viewMode = String(sp.view ?? "grid") as "grid" | "list";
  const totalPages = Math.ceil(total / PRODUCTS_PER_PAGE);

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://apexarchery.com";
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    ...slug.slice(0, -1).map((s, i) => ({
      name: s.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
      url: `/categories/${slug.slice(0, i + 1).join("/")}`,
    })),
    { name: categoryResult.name, url: `/categories/${slug.join("/")}` },
  ];

  return (
    <div>
      <SchemaOrg data={breadcrumbSchema(breadcrumbItems, BASE_URL)} />
      <CategoryHero
        name={categoryResult.name}
        description={categoryResult.description}
        imageUrl={categoryResult.imageUrl}
        breadcrumbs={breadcrumbs}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <SubcategoryLinks subcategories={subcategories} basePath={`/categories/${slug.join("/")}`} />

        <div className="flex items-center justify-between mb-6 lg:hidden">
          <span className="text-sm text-white/40">{total} products</span>
          <FilterDrawer
            brands={brands}
            subcategories={subcategories}
            categorySlug={slug.join("/")}
            totalProducts={total}
            activeFilterCount={activeFilterCount}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10">
          <div className="hidden lg:block">
            <FilterPanel
              brands={brands}
              subcategories={subcategories}
              categorySlug={slug.join("/")}
              totalProducts={total}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-white/40">{total} products</span>
              <div className="flex items-center gap-4">
                <OpenAIButton label="Need help choosing?" variant="inline" />
                <ViewToggle currentView={viewMode} />
              </div>
            </div>
            <div className={viewMode === "list" ? "space-y-4" : "grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-10"}>
              {enrichedProducts.map((product) => (
                <ProductCard key={product.id} product={product} mode={viewMode} />
              ))}
            </div>

            {enrichedProducts.length === 0 && (
              <div className="text-center py-20">
                <p className="text-white/40 text-lg mb-2">No products found</p>
                <p className="text-white/30 text-sm">Try adjusting your filters</p>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`?${new URLSearchParams({ ...sp as any, page: String(p) }).toString()}`}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/5 text-white/60 hover:bg-white/10"
                    }`}
                  >
                    {p}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {categoryResult.description && (
          <div className="mt-16 pt-10 border-t border-white/5">
            <div className="prose prose-invert max-w-3xl text-white/50 text-sm">
              <p>{categoryResult.description}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
