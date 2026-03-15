import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db, productsTable, productImagesTable, productVariantsTable, productSpecsTable, productFaqsTable, productCategoriesTable, productTagsTable, categoriesTable, brandsTable } from "@/lib/db";
import { eq, sql, asc } from "drizzle-orm";
import { ProductEditForm } from "./ProductEditForm";

export const metadata: Metadata = { title: "Edit Product" };

async function getProduct(id: string) {
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id)).limit(1);
  if (!product) return null;

  const [images, variants, specs, faqs, catLinks, relatedTags] = await Promise.all([
    db.select().from(productImagesTable).where(eq(productImagesTable.productId, product.id)).orderBy(asc(productImagesTable.sortOrder)),
    db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, product.id)).orderBy(asc(productVariantsTable.sortOrder)),
    db.select().from(productSpecsTable).where(eq(productSpecsTable.productId, product.id)).orderBy(asc(productSpecsTable.sortOrder)),
    db.select().from(productFaqsTable).where(eq(productFaqsTable.productId, product.id)).orderBy(asc(productFaqsTable.sortOrder)),
    db.select({ categoryId: productCategoriesTable.categoryId }).from(productCategoriesTable).where(eq(productCategoriesTable.productId, product.id)),
    db.select({ tag: productTagsTable.tag }).from(productTagsTable).where(sql`${productTagsTable.productId} = ${product.id} AND ${productTagsTable.tag} LIKE 'related:%'`),
  ]);

  const categoryIds = catLinks.map((c) => c.categoryId);
  const categories = categoryIds.length > 0 ? await db.select({ id: categoriesTable.id, name: categoriesTable.name, slug: categoriesTable.slug }).from(categoriesTable).where(sql`${categoriesTable.id} IN ${categoryIds}`) : [];
  const [brand] = product.brandId ? await db.select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug }).from(brandsTable).where(eq(brandsTable.id, product.brandId)) : [null];

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    status: product.status,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? "",
    cost: product.cost ?? "",
    brandId: product.brandId ?? "",
    distributorId: product.distributorId ?? "",
    seoTitle: product.seoTitle ?? "",
    seoDesc: product.seoDesc ?? "",
    gtin: product.gtin ?? "",
    mpn: product.mpn ?? "",
    images: images.map((i) => ({ id: i.id, url: i.url, altText: i.altText ?? "", sortOrder: i.sortOrder })),
    variants: variants.map((v) => ({ id: v.id, sku: v.sku, name: v.name, price: v.price ?? "", options: (v.options ?? {}) as Record<string, string> })),
    specs: specs.map((s) => ({ id: s.id, label: s.label, value: s.value })),
    faqs: faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
    categoryIds: categories.map((c) => c.id),
    relatedProductIds: relatedTags.map((t) => t.tag.replace("related:", "")),
    brand,
  };
}

export default async function AdminProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return <ProductEditForm product={product} />;
}
