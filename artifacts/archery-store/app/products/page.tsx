import type { Metadata } from "next";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { db, productsTable, productImagesTable, brandsTable, reviewsTable, categoriesTable, productCategoriesTable, collectionsTable, productCollectionsTable } from "@workspace/db";
import { eq, and, asc, desc, sql, gte, lte, ilike, type SQL } from "drizzle-orm";
import { ProductCard } from "@/components/ProductCard";
import { CatalogFilters } from "@/components/CatalogFilters";

export const metadata: Metadata = {
  title: "All Gear",
  description: "Explore our complete collection of premium archery equipment.",
};

interface CatalogProps {
  searchParams: Promise<{ category?: string; brand?: string; sort?: string; search?: string; minPrice?: string; maxPrice?: string; page?: string }>;
}

async function getCategories() {
  return db.select({ id: categoriesTable.id, name: categoriesTable.name, slug: categoriesTable.slug }).from(categoriesTable).orderBy(asc(categoriesTable.name));
}

async function getCategoryDescription(slug: string) {
  const descriptions: Record<string, string> = {
    "compound-bows": "Precision-engineered compound bows for competitive and hunting archers. Ultra-high modulus carbon construction delivers unmatched performance at every draw weight.",
    "recurve-bows": "Traditional craftsmanship meets modern materials. Our recurve selection ranges from Olympic-grade target bows to field-ready hunting recurves.",
    "arrows": "Carbon fiber arrows and broadheads engineered for penetration and flight consistency. Match-grade components for every discipline.",
    "apparel": "Technical hunting and archery apparel built with advanced fabrics. Quiet, durable, and designed for all-weather performance.",
  };
  return descriptions[slug] || "Explore our curated selection of premium archery equipment, field-tested and approved by competitive archers and hunters.";
}

async function getProducts(params: { category?: string; brand?: string; sort?: string; search?: string; minPrice?: string; maxPrice?: string; page?: string }) {
  const page = Number(params.page) || 1;
  const limit = 24;
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [eq(productsTable.status, "ACTIVE")];

  if (params.search) {
    conditions.push(ilike(productsTable.name, `%${params.search}%`));
  }
  if (params.category) {
    const cat = await db.select({ id: categoriesTable.id }).from(categoriesTable).where(eq(categoriesTable.slug, params.category)).limit(1);
    if (cat.length > 0) {
      const catProductIds = await db.select({ productId: productCategoriesTable.productId }).from(productCategoriesTable).where(eq(productCategoriesTable.categoryId, cat[0].id));
      if (catProductIds.length > 0) {
        conditions.push(sql`${productsTable.id} IN ${catProductIds.map((c) => c.productId)}`);
      } else {
        conditions.push(sql`false`);
      }
    }
  }
  if (params.brand) {
    const b = await db.select({ id: brandsTable.id }).from(brandsTable).where(eq(brandsTable.slug, params.brand)).limit(1);
    if (b.length > 0) conditions.push(eq(productsTable.brandId, b[0].id));
  }
  if (params.minPrice) conditions.push(gte(productsTable.price, params.minPrice));
  if (params.maxPrice) conditions.push(lte(productsTable.price, params.maxPrice));

  const where = and(...conditions);

  let orderBy;
  if (params.sort === "price_asc") orderBy = asc(productsTable.price);
  else if (params.sort === "price_desc") orderBy = desc(productsTable.price);
  else if (params.sort === "name_asc") orderBy = asc(productsTable.name);
  else orderBy = desc(productsTable.createdAt);

  const [products, countResult] = await Promise.all([
    db.select().from(productsTable).where(where).orderBy(orderBy).limit(limit).offset(offset),
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
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export default async function CatalogPage({ searchParams }: CatalogProps) {
  const params = await searchParams;
  const [categories, data] = await Promise.all([getCategories(), getProducts(params)]);
  const currentCategory = params.category || "";
  const currentSort = params.sort || "newest";
  const categoryTitle = currentCategory
    ? currentCategory.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Shop";
  const categoryDescription = currentCategory
    ? await getCategoryDescription(currentCategory)
    : "Explore our curated selection of premium archery equipment, field-tested and approved by competitive archers and hunters.";

  return (
    <div className="pt-28 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-sm text-white/40 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/products" className="hover:text-white transition-colors">Shop</Link>
          {currentCategory && (
            <>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="text-foreground">{categoryTitle}</span>
            </>
          )}
        </nav>

        <div className="mb-10">
          <h1 className="font-display text-4xl md:text-5xl font-normal text-white mb-4 normal-case">{categoryTitle}</h1>
          <p className="text-white/50 max-w-2xl text-base leading-relaxed">{categoryDescription}</p>
        </div>

        <CatalogFilters
          categories={categories}
          currentCategory={currentCategory}
          currentSort={currentSort}
          currentMinPrice={params.minPrice || ""}
          currentMaxPrice={params.maxPrice || ""}
          totalProducts={data.total}
        />

        {data.products.length === 0 ? (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-normal mb-2 text-white">No products found</h3>
            <p className="text-white/40 mb-6">Try adjusting your filters or search criteria.</p>
            <Link href="/products" className="text-primary font-bold hover:underline">
              Clear all filters
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
            {data.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

