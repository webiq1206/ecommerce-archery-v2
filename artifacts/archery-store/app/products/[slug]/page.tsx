import type { Metadata } from "next";
import {
  db,
  productsTable,
  productImagesTable,
  productVariantsTable,
  productSpecsTable,
  productFaqsTable,
  productCategoriesTable,
  productTagsTable,
  categoriesTable,
  brandsTable,
  reviewsTable,
} from "@workspace/db";
import { eq, and, sql, asc, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductTabs } from "@/components/product/ProductTabs";
import { ReviewSection } from "@/components/product/ReviewSection";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { BundleBuilder } from "@/components/product/BundleBuilder";
import { SchemaOrg } from "@/components/seo/SchemaOrg";
import { productSchema, breadcrumbSchema, faqSchema } from "@/lib/seo/schemas";
import { ProductViewTracker } from "@/components/analytics/ProductViewTracker";

export const revalidate = 3600;

export async function generateStaticParams() {
  const products = await db
    .select({ slug: productsTable.slug })
    .from(productsTable)
    .where(eq(productsTable.status, "ACTIVE"));
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.slug, slug))
    .limit(1);
  if (!product) return { title: "Product Not Found" };

  const [image] = await db
    .select()
    .from(productImagesTable)
    .where(eq(productImagesTable.productId, product.id))
    .orderBy(asc(productImagesTable.sortOrder))
    .limit(1);

  const brand = product.brandId
    ? (await db.select().from(brandsTable).where(eq(brandsTable.id, product.brandId)).limit(1))[0]
    : null;

  return {
    title: product.seoTitle ?? product.name,
    description: product.seoDesc ?? product.shortDescription ?? `Buy ${product.name} at Apex Archery.`,
    openGraph: {
      title: product.seoTitle ?? product.name,
      description: product.seoDesc ?? product.shortDescription ?? undefined,
      url: `/products/${slug}`,
      siteName: "Apex Archery",
      images: image ? [{ url: image.url, alt: image.altText ?? product.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.seoTitle ?? product.name,
      description: product.seoDesc ?? product.shortDescription ?? undefined,
      images: image ? [image.url] : undefined,
    },
    alternates: { canonical: `/products/${slug}` },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.slug, slug))
    .limit(1);

  if (!product) notFound();

  const [images, variants, specs, faqs, productCategories, tags, brand, reviewsData, reviewAgg] =
    await Promise.all([
      db.select().from(productImagesTable).where(eq(productImagesTable.productId, product.id)).orderBy(asc(productImagesTable.sortOrder)),
      db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, product.id)).orderBy(asc(productVariantsTable.sortOrder)),
      db.select().from(productSpecsTable).where(eq(productSpecsTable.productId, product.id)).orderBy(asc(productSpecsTable.sortOrder)),
      db.select().from(productFaqsTable).where(eq(productFaqsTable.productId, product.id)).orderBy(asc(productFaqsTable.sortOrder)),
      db.select().from(productCategoriesTable).where(eq(productCategoriesTable.productId, product.id)),
      db.select().from(productTagsTable).where(eq(productTagsTable.productId, product.id)),
      product.brandId
        ? db.select().from(brandsTable).where(eq(brandsTable.id, product.brandId)).limit(1).then((r) => r[0] ?? null)
        : null,
      db
        .select()
        .from(reviewsTable)
        .where(and(eq(reviewsTable.productId, product.id), eq(reviewsTable.isApproved, true)))
        .orderBy(desc(reviewsTable.createdAt))
        .limit(20),
      db
        .select({
          avg: sql<number>`coalesce(avg(${reviewsTable.rating}), 0)::numeric(3,2)`,
          count: sql<number>`count(*)::int`,
        })
        .from(reviewsTable)
        .where(and(eq(reviewsTable.productId, product.id), eq(reviewsTable.isApproved, true))),
    ]);

  const primaryCatRow = productCategories.find((pc) => pc.isPrimary) ?? productCategories[0];
  const category = primaryCatRow
    ? await db.select().from(categoriesTable).where(eq(categoriesTable.id, primaryCatRow.categoryId)).limit(1).then((r) => r[0] ?? null)
    : null;

  const avgRating = Number(reviewAgg[0]?.avg ?? 0);
  const reviewCount = reviewAgg[0]?.count ?? 0;
  const totalInventory = variants.reduce((sum, v) => sum + v.inventory, 0);

  // Related products
  const relatedProductIds = primaryCatRow
    ? await db
        .select({ productId: productCategoriesTable.productId })
        .from(productCategoriesTable)
        .where(
          and(
            eq(productCategoriesTable.categoryId, primaryCatRow.categoryId),
            sql`${productCategoriesTable.productId} != ${product.id}`
          )
        )
        .limit(8)
    : [];

  let relatedProducts: any[] = [];
  if (relatedProductIds.length > 0) {
    const rpIds = relatedProductIds.map((r) => r.productId);
    const rProducts = await db
      .select()
      .from(productsTable)
      .where(and(sql`${productsTable.id} IN ${rpIds}`, eq(productsTable.status, "ACTIVE")))
      .limit(4);
    const rImages = rpIds.length > 0
      ? await db.select().from(productImagesTable).where(sql`${productImagesTable.productId} IN ${rpIds}`).orderBy(asc(productImagesTable.sortOrder))
      : [];
    const rImageMap = new Map<string, any[]>();
    for (const img of rImages) {
      if (!rImageMap.has(img.productId)) rImageMap.set(img.productId, []);
      rImageMap.get(img.productId)!.push(img);
    }
    relatedProducts = rProducts.map((p) => ({
      ...p,
      images: rImageMap.get(p.id) ?? [],
      brand: p.brandId && brand ? { id: brand.id, name: brand.name, slug: brand.slug } : null,
    }));
  }

  // Bundle suggestions via shared tags
  const productTags = tags.map((t) => t.tag);
  let bundleProducts: any[] = [];
  if (productTags.length > 0) {
    const taggedProductIds = await db
      .select({ productId: productTagsTable.productId })
      .from(productTagsTable)
      .where(
        and(
          sql`${productTagsTable.tag} IN ${productTags}`,
          sql`${productTagsTable.productId} != ${product.id}`
        )
      )
      .limit(4);

    if (taggedProductIds.length > 0) {
      const bpIds = taggedProductIds.map((t) => t.productId);
      const bProducts = await db
        .select()
        .from(productsTable)
        .where(and(sql`${productsTable.id} IN ${bpIds}`, eq(productsTable.status, "ACTIVE")))
        .limit(4);
      const bImages = await db
        .select()
        .from(productImagesTable)
        .where(sql`${productImagesTable.productId} IN ${bpIds}`)
        .orderBy(asc(productImagesTable.sortOrder));
      const bImageMap = new Map<string, any[]>();
      for (const img of bImages) {
        if (!bImageMap.has(img.productId)) bImageMap.set(img.productId, []);
        bImageMap.get(img.productId)!.push(img);
      }
      bundleProducts = bProducts.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        image: bImageMap.get(p.id)?.[0]?.url ?? "/images/product-bow-1.png",
      }));
    }
  }

  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://apexarchery.com";

  const pdpProductSchema = productSchema(
    {
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      slug: product.slug,
      sku: product.sku,
      price: product.price,
      brand: brand ? { name: brand.name } : null,
      images: images.map((img) => img.url),
      averageRating: avgRating,
      reviewCount,
    },
    BASE_URL
  );

  const pdpBreadcrumbSchema = breadcrumbSchema(
    [
      { name: "Home", url: "/" },
      ...(category ? [{ name: category.name, url: `/categories/${category.slug}` }] : []),
      { name: product.name, url: `/products/${product.slug}` },
    ],
    BASE_URL
  );

  const schemas: Record<string, unknown>[] = [pdpProductSchema, pdpBreadcrumbSchema];
  if (faqs.length > 0) {
    schemas.push(faqSchema(faqs.map((f) => ({ question: f.question, answer: f.answer }))));
  }

  return (
    <div>
      <SchemaOrg data={schemas} />
      <ProductViewTracker
        productId={product.id}
        name={product.name}
        price={String(product.price)}
        category={category?.name}
      />

      {/* Above the fold */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-10 lg:gap-16">
          <ProductGallery
            images={images.map((img) => ({
              id: img.id,
              url: img.url,
              altText: img.altText,
              isLifestyle: img.isLifestyle,
            }))}
          />
          <ProductInfo
            product={{
              id: product.id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              shortDescription: product.shortDescription,
              images: images.map((img) => ({ url: img.url })),
            }}
            brand={brand ? { name: brand.name, slug: brand.slug } : null}
            category={category ? { name: category.name, slug: category.slug } : null}
            variants={variants.map((v) => ({
              id: v.id,
              name: v.name,
              sku: v.sku,
              price: v.price,
              inventory: v.inventory,
              isAvailable: v.isAvailable,
              options: v.options,
              imageUrl: v.imageUrl,
            }))}
            averageRating={avgRating}
            reviewCount={reviewCount}
            totalInventory={totalInventory}
          />
        </div>
      </div>

      {/* Product Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ProductTabs
          description={product.description}
          specs={specs}
          faqs={faqs}
          reviews={reviewsData.map((r) => ({
            id: r.id,
            authorName: r.authorName,
            rating: r.rating,
            title: r.title,
            body: r.body,
            isVerified: r.isVerified,
            createdAt: r.createdAt.toISOString(),
          }))}
          averageRating={avgRating}
          reviewCount={reviewCount}
          productId={product.id}
        />
      </div>

      {/* Related Products */}
      <RelatedProducts products={relatedProducts} />

      {/* Bundle Builder */}
      <BundleBuilder products={bundleProducts} />
    </div>
  );
}
