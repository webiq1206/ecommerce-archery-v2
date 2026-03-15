import { NextRequest, NextResponse } from "next/server";
import { eq, and, asc, sql } from "drizzle-orm";
import { db, productsTable, productImagesTable, productVariantsTable, productSpecsTable, productFaqsTable, productCategoriesTable, productTagsTable, categoriesTable, brandsTable, reviewsTable } from "@workspace/db";
import { UpdateProductBody } from "@workspace/api-zod";

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
  const raw = await request.json();
  const parsed = UpdateProductBody.passthrough().safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.message }, { status: 400 });

  const data = parsed.data;
  const [product] = await db.update(productsTable).set({
    name: data.name, slug: data.slug,
    status: data.status as "DRAFT" | "ACTIVE" | "ARCHIVED" | undefined,
    shortDescription: data.shortDescription, description: data.description,
    price: data.price, compareAtPrice: data.compareAtPrice,
    brandId: data.brandId, distributorId: data.distributorId,
    isFeatured: data.isFeatured, isNewArrival: data.isNewArrival,
    seoTitle: raw.seoTitle ?? undefined,
    seoDesc: raw.seoDesc ?? undefined,
    gtin: raw.gtin ?? undefined,
    mpn: raw.mpn ?? undefined,
  }).where(eq(productsTable.id, id)).returning();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // Images
  await db.delete(productImagesTable).where(eq(productImagesTable.productId, id));
  if (raw.images?.length) {
    await db.insert(productImagesTable).values(
      raw.images.map((img: any) => ({ productId: id, url: img.url, sortOrder: img.sortOrder ?? 0 }))
    );
  }

  // Specs
  await db.delete(productSpecsTable).where(eq(productSpecsTable.productId, id));
  if (raw.specs?.length) {
    await db.insert(productSpecsTable).values(
      raw.specs.map((s: any) => ({ productId: id, label: s.label, value: s.value, sortOrder: s.sortOrder ?? 0 }))
    );
  }

  // FAQs
  await db.delete(productFaqsTable).where(eq(productFaqsTable.productId, id));
  if (raw.faqs?.length) {
    await db.insert(productFaqsTable).values(
      raw.faqs.map((f: any) => ({ productId: id, question: f.question, answer: f.answer, sortOrder: f.sortOrder ?? 0 }))
    );
  }

  // Categories
  await db.delete(productCategoriesTable).where(eq(productCategoriesTable.productId, id));
  if (raw.categoryIds?.length) {
    await db.insert(productCategoriesTable).values(
      raw.categoryIds.map((catId: string) => ({
        productId: id,
        categoryId: catId,
        isPrimary: catId === raw.primaryCategoryId,
      }))
    );
  }

  // Variants
  await db.delete(productVariantsTable).where(eq(productVariantsTable.productId, id));
  if (raw.variants?.length) {
    await db.insert(productVariantsTable).values(
      raw.variants.map((v: any) => ({
        productId: id,
        sku: v.sku,
        name: v.name,
        price: v.price || null,
        inventory: v.inventory ?? 0,
        isAvailable: v.isAvailable ?? true,
        options: v.options,
        sortOrder: v.sortOrder ?? 0,
      }))
    );
  }

  // Related products (stored as product tags with "related:" prefix)
  if (raw.relatedProductIds) {
    await db.delete(productTagsTable).where(
      and(eq(productTagsTable.productId, id), sql`${productTagsTable.tag} LIKE 'related:%'`)
    );
    for (const relId of raw.relatedProductIds) {
      if (relId) {
        await db.insert(productTagsTable).values({ productId: id, tag: `related:${relId}` });
      }
    }
  }

  return NextResponse.json(product);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product] = await db.delete(productsTable).where(eq(productsTable.id, id)).returning();
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
