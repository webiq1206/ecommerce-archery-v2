import type { Metadata } from "next";
import Link from "next/link";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { db, productsTable, productImagesTable, brandsTable, reviewsTable, categoriesTable, productCategoriesTable, collectionsTable, productCollectionsTable } from "@workspace/db";
import { eq, and, asc, desc, sql, gte, lte, ilike, type SQL } from "drizzle-orm";
import { ProductCard } from "@/components/ProductCard";

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

  return (
    <>
      <div className="relative h-[40vh] min-h-[320px] flex items-end overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/catalog-banner.png"
          alt="Archery collection"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-black/50 to-black/30" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 w-full">
          <h1 className="font-display text-4xl md:text-6xl font-normal text-white mb-3">
            {currentCategory ? currentCategory.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "The Complete Collection"}
          </h1>
          <p className="text-white/50 max-w-2xl text-lg">
            Explore our complete selection of premium archery equipment.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full flex flex-col lg:flex-row gap-12">
        <aside className="w-full lg:w-64 shrink-0 space-y-8">
          <div>
            <h3 className="font-normal text-lg mb-4 flex items-center gap-2 border-b border-white/10 pb-2 text-white">
              <Filter className="w-5 h-5 text-primary" /> Categories
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/products"
                  className={`text-sm hover:text-primary transition-colors ${!currentCategory ? "text-primary font-bold" : "text-white/50"}`}
                >
                  All Products
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/products?category=${c.slug}`}
                    className={`text-sm hover:text-primary transition-colors ${currentCategory === c.slug ? "text-primary font-bold" : "text-white/50"}`}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-white/10 gap-4">
            <p className="text-sm text-white/40">
              Showing {data.products.length} of {data.total} products
            </p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/40 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4" /> Sort by:
              </span>
              <SortSelect currentSort={currentSort} currentCategory={currentCategory} />
            </div>
          </div>

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
    </>
  );
}

function SortSelect({ currentSort, currentCategory }: { currentSort: string; currentCategory: string }) {
  const baseUrl = currentCategory ? `/products?category=${currentCategory}&` : "/products?";
  return (
    <div className="relative">
      <div className="flex gap-2 text-sm">
        {[
          { value: "newest", label: "Newest" },
          { value: "price_asc", label: "Price: Low-High" },
          { value: "price_desc", label: "Price: High-Low" },
          { value: "name_asc", label: "A-Z" },
        ].map((opt) => (
          <Link
            key={opt.value}
            href={`${baseUrl}sort=${opt.value}`}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              currentSort === opt.value ? "bg-primary text-primary-foreground font-medium" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white"
            }`}
          >
            {opt.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
