import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Shield, Truck } from "lucide-react";
import { db, productsTable, productImagesTable, productVariantsTable, productSpecsTable, productFaqsTable, productCategoriesTable, categoriesTable, brandsTable, reviewsTable } from "@workspace/db";
import { eq, and, asc, sql } from "drizzle-orm";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ReviewCard } from "@/components/ReviewCard";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  const [product] = await db
    .select()
    .from(productsTable)
    .where(and(
      sql`(${productsTable.slug} = ${slug} OR ${productsTable.id} = ${slug})`,
      eq(productsTable.status, "ACTIVE")
    ))
    .limit(1);

  if (!product) return null;

  const [images, variants, specs, faqs, catLinks, reviews] = await Promise.all([
    db.select().from(productImagesTable).where(eq(productImagesTable.productId, product.id)).orderBy(asc(productImagesTable.sortOrder)),
    db.select().from(productVariantsTable).where(eq(productVariantsTable.productId, product.id)).orderBy(asc(productVariantsTable.sortOrder)),
    db.select().from(productSpecsTable).where(eq(productSpecsTable.productId, product.id)).orderBy(asc(productSpecsTable.sortOrder)),
    db.select().from(productFaqsTable).where(eq(productFaqsTable.productId, product.id)).orderBy(asc(productFaqsTable.sortOrder)),
    db.select({ categoryId: productCategoriesTable.categoryId }).from(productCategoriesTable).where(eq(productCategoriesTable.productId, product.id)),
    db.select().from(reviewsTable).where(and(eq(reviewsTable.productId, product.id), eq(reviewsTable.isApproved, true))),
  ]);

  const categoryIds = catLinks.map((c) => c.categoryId);
  const categories =
    categoryIds.length > 0
      ? await db.select({ id: categoriesTable.id, name: categoriesTable.name, slug: categoriesTable.slug }).from(categoriesTable).where(sql`${categoriesTable.id} IN ${categoryIds}`)
      : [];

  let brand = null;
  if (product.brandId) {
    const [b] = await db.select({ id: brandsTable.id, name: brandsTable.name, slug: brandsTable.slug }).from(brandsTable).where(eq(brandsTable.id, product.brandId));
    brand = b ?? null;
  }

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return {
    ...product,
    images: images.map((i) => ({ id: i.id, url: i.url, altText: i.altText, sortOrder: i.sortOrder })),
    variants: variants.map((v) => ({ id: v.id, sku: v.sku, name: v.name, price: v.price, compareAtPrice: v.compareAtPrice })),
    specs: specs.map((s) => ({ id: s.id, label: s.label, value: s.value })),
    faqs: faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer })),
    brand,
    categories,
    reviews: reviews.map((r) => ({ id: r.id, authorName: r.authorName, rating: r.rating, title: r.title, body: r.body, isVerified: r.isVerified, createdAt: r.createdAt.toISOString() })),
    reviewCount: reviews.length,
    avgRating: Math.round(avgRating * 10) / 10,
  };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.name,
    description: product.shortDescription || product.description || `${product.name} - Premium archery gear from Apex Archery`,
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const images = product.images.length > 0
    ? product.images.map((i) => i.url)
    : ["https://placehold.co/800x1000/1A1A1A/C8922A?text=Product"];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-sm text-muted-foreground mb-8">
        Home / {product.categories?.[0]?.name || "Products"} / <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
        <div className="flex flex-col-reverse md:flex-row gap-4">
          <div className="flex md:flex-col gap-4 overflow-x-auto md:w-24 shrink-0">
            {images.map((url, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-lg overflow-hidden border-2 border-transparent shrink-0 w-20 md:w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="flex-1 bg-muted/30 rounded-3xl overflow-hidden aspect-[4/5] relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images[0]}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>
        </div>

        <div className="flex flex-col pt-4">
          {product.brand && (
            <p className="text-sm font-bold tracking-widest text-primary uppercase mb-2">{product.brand.name}</p>
          )}
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">{product.name}</h1>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-medium">${product.price}</span>
            {product.compareAtPrice && (
              <span className="text-xl text-muted-foreground line-through">${product.compareAtPrice}</span>
            )}
          </div>

          {product.reviewCount > 0 && (
            <p className="text-sm text-muted-foreground mb-4">
              {product.avgRating} stars ({product.reviewCount} reviews)
            </p>
          )}

          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            {product.shortDescription || product.description}
          </p>

          <AddToCartButton
            productId={product.id}
            productName={product.name}
            variants={product.variants}
            basePrice={product.price}
          />

          <div className="grid grid-cols-2 gap-4 mt-8 p-6 bg-muted/50 rounded-2xl">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h5 className="text-sm font-bold">Fast Shipping</h5>
                <p className="text-xs text-muted-foreground">Ships within 24 hours</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h5 className="text-sm font-bold">Authorized Dealer</h5>
                <p className="text-xs text-muted-foreground">Full factory warranty</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {product.specs.length > 0 && (
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">Specifications</h2>
          <div className="border rounded-2xl overflow-hidden divide-y">
            {product.specs.map((spec) => (
              <div key={spec.id} className="flex px-6 py-4">
                <span className="w-1/3 font-medium text-muted-foreground">{spec.label}</span>
                <span className="w-2/3">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {product.description && (
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="font-display text-2xl font-bold mb-6">Description</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none text-muted-foreground">
            <p>{product.description}</p>
          </div>
        </div>
      )}

      {product.reviews.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-2">Customer Reviews</h2>
          <p className="text-muted-foreground mb-8">
            {product.avgRating} out of 5 stars &middot; {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
