/** Product for JSON-LD - extended from DB product with optional brand, images, reviews */
export interface ProductForSchema {
  name: string;
  description?: string | null;
  shortDescription?: string | null;
  slug: string;
  sku: string;
  mpn?: string | null;
  gtin?: string | null;
  price: string | number;
  brand?: { name: string } | null;
  image?: string | null;
  images?: string[] | null;
  averageRating?: number;
  reviewCount?: number;
}

/**
 * Returns Product JSON-LD schema with name, description, sku, mpn, brand, image,
 * offers (price, availability, priceCurrency: USD), and optional aggregateRating.
 */
export function productSchema(product: ProductForSchema, baseUrl: string) {
  const url = `${baseUrl}/products/${product.slug}`;
  const imageUrls = product.images?.length
    ? product.images
    : product.image
      ? [product.image]
      : [];

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: (product.description || product.shortDescription || "").trim() || product.name,
    sku: product.sku,
    url,
    ...(product.mpn && { mpn: product.mpn }),
    ...(product.gtin && { gtin: product.gtin }),
    ...(product.brand?.name && {
      brand: {
        "@type": "Brand",
        name: product.brand.name,
      },
    }),
    ...(imageUrls.length > 0 && { image: imageUrls }),
    offers: {
      "@type": "Offer",
      price: typeof product.price === "string" ? product.price : String(product.price),
      priceCurrency: "USD",
      availability:
        typeof (product as unknown as { totalInventory?: number }).totalInventory === "number"
          ? (product as unknown as { totalInventory: number }).totalInventory > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url,
    },
  };

  if (
    typeof product.averageRating === "number" &&
    product.averageRating > 0 &&
    typeof product.reviewCount === "number" &&
    product.reviewCount > 0
  ) {
    (schema as Record<string, unknown>).aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: product.averageRating,
      reviewCount: product.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return schema;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Returns BreadcrumbList JSON-LD schema.
 */
export function breadcrumbSchema(items: BreadcrumbItem[], baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${baseUrl}${item.url}`,
    })),
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Returns FAQPage JSON-LD schema.
 */
export function faqSchema(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export interface ArticleForSchema {
  headline: string;
  author?: string | null;
  datePublished?: string | Date | null;
  dateModified?: string | Date | null;
  image?: string | null;
  description?: string | null;
  url?: string | null;
}

/**
 * Returns Article JSON-LD schema with headline, author, datePublished, image.
 */
export function articleSchema(article: ArticleForSchema, baseUrl: string) {
  const datePublished =
    article.datePublished instanceof Date
      ? article.datePublished.toISOString()
      : typeof article.datePublished === "string"
        ? article.datePublished
        : undefined;
  const dateModified =
    article.dateModified instanceof Date
      ? article.dateModified.toISOString()
      : typeof article.dateModified === "string"
        ? article.dateModified
        : undefined;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.headline,
    ...(article.description && { description: article.description }),
    ...(article.image && { image: article.image }),
    ...(article.url && { url: article.url.startsWith("http") ? article.url : `${baseUrl}${article.url}` }),
    ...(article.author && {
      author: {
        "@type": "Person",
        name: article.author,
      },
    }),
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
  };

  return schema;
}

/**
 * Returns Organization JSON-LD schema for "Apex Archery".
 */
export function organizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Apex Archery",
    url: baseUrl,
  };
}

/**
 * Returns WebSite JSON-LD schema with SearchAction potentialAction.
 */
export function websiteSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Apex Archery",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
