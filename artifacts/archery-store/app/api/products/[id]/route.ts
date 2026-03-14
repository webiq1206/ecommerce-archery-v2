import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc, sql } from "drizzle-orm";
import { db, productsTable, productImagesTable, productVariantsTable, productSpecsTable, productFaqsTable, productCategoriesTable, categoriesTable, brandsTable, reviewsTable } from "@workspace/db";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product] = await db.select().from(productsTable).where(sql`${productsTable.id} = ${id} OR ${productsTable.slug} = ${id}`).limit(1);

  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const [images, variants, specs, faqs, catLinks, reviews] = await Promise.all([
    db.select().from(productImagesTable).where(eq(productImagesTable.productId, product.id)).orderBy(asc(productImagesTable.sortOrder)),
    db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, product.id)).orderBy(asc(productVariantsTable.sortOrder)),
    db.select().from(productSpecsTable).where(eq(productSpecsTable.productId, product.id)).orderBy(asc(productSpecsTable.sortOrder)),
    db.select().from(productFaqsTable).where(eq(productFaqsTable.productId, product.id)).orderBy(asc(productFaqsTable.sortOrder)),
    db.select({ categoryId: productCategoriesTable.categoryId }).from(productCategoriesTable).where(eq(productCategoriesTable.productId, product.id)),
    db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(and(eq(reviewsTable.productId, product.id), eq(reviewsTable.isApproved, true))),
  ]);

  const categoryIds = catLinks.map((c) => c.categoryId);
  const categories = categoryIds.length > 0 ? await db.select({ id: categoriesTable.id, name: categoriesTable.name, slug: categoriesTable.slug }).from(categoriesTable).where(sql`${categoriesTable.id} IN ${categoryIds}`) : [];
  let brand = null;
  if (product.brandId) {
    const [b] = await db.select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug }).from(brandsTable).where(eq(brandsTable.id, product.brandId));
    brand = b ?? null;
  }
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return NextResponse.json({
    ...product, createdAt: product.createdAt.toISOString(), updatedAt: product.updatedAt.toISOString(),
    images: images.map((i) => ({ id: i.id, url: i.url, altText: i.altText, sortOrder: i.sortOrder })),
    variants: variants.map((v) => ({ id: v.id, sku: v.sku, name: v.name, price: v.price, compareAtPrice: v.compareAtPrice })),
    specs: specs.map((s) => ({ id: s.id, label: s.label, value: s.value })),
    faqs: faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
    brand, categories, reviewCount: reviews.length, avgRating: Math.round(avgRating * 10) / 10,
  });
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();
  const [product] = await db.update(productsTable).set({
    name: data.name, slug: data.slug, status: data.status,
    shortDescription: data.shortDescription, description: data.description,
    price: data.price, compareAtPrice: data.compareAtPrice,
    brandId: data.brandId, distributorId: data.distributorId,
    isFeatured: data.isFeatured, isNewArrival: data.isNewArrival,
  }).where(eq(productsTable.id, id)).returning();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product] = await db.delete(productsTable).where(eq(productsTable.id, id)).returning();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
