import type { Metadata } from "next";

const SITE_NAME = "Apex Archery";

function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://apexarchery.com")
  );
}

/**
 * Generates Next.js Metadata for a product page with absolute canonical URLs.
 */
export function generateProductMetadata(product: {
  name: string;
  slug: string;
  seoTitle?: string | null;
  seoDesc?: string | null;
  shortDescription?: string | null;
  image?: string | null;
}) {
  const baseUrl = getBaseUrl();
  const title = product.seoTitle ?? product.name;
  const description =
    product.seoDesc ?? product.shortDescription ?? `Buy ${product.name} at ${SITE_NAME}.`;
  const canonical = `${baseUrl}/products/${product.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      ...(product.image && {
        images: [{ url: product.image, alt: product.name }],
      }),
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      ...(product.image && { images: [product.image] }),
    },
    alternates: { canonical },
  } satisfies Metadata;
}

/**
 * Generates Next.js Metadata for a category page.
 */
export function generateCategoryMetadata(category: {
  name: string;
  slug: string;
  seoTitle?: string | null;
  seoDesc?: string | null;
  description?: string | null;
  imageUrl?: string | null;
}) {
  const baseUrl = getBaseUrl();
  const title = category.seoTitle ?? `${category.name} | ${SITE_NAME}`;
  const description =
    category.seoDesc ?? category.description ?? `Shop ${category.name} at ${SITE_NAME}.`;
  const canonical = `${baseUrl}/categories/${category.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      ...(category.imageUrl && {
        images: [{ url: category.imageUrl, alt: category.name }],
      }),
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      ...(category.imageUrl && { images: [category.imageUrl] }),
    },
    alternates: { canonical },
  } satisfies Metadata;
}

/**
 * Generates Next.js Metadata for a blog post.
 */
export function generateBlogMetadata(post: {
  title: string;
  slug: string;
  excerpt?: string | null;
  seoTitle?: string | null;
  seoDesc?: string | null;
  coverImage?: string | null;
}) {
  const baseUrl = getBaseUrl();
  const title = post.seoTitle ?? post.title;
  const description =
    post.seoDesc ?? post.excerpt ?? `Read ${post.title} on ${SITE_NAME}.`;
  const canonical = `${baseUrl}/blog/${post.slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: "article",
      ...(post.coverImage && {
        images: [{ url: post.coverImage, alt: post.title }],
      }),
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      ...(post.coverImage && { images: [post.coverImage] }),
    },
    alternates: { canonical },
  } satisfies Metadata;
}
