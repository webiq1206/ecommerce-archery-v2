import { ProductCard } from "@/components/ProductCard";

interface RelatedProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  compareAtPrice?: string | null;
  isFeatured?: boolean | null;
  isNewArrival?: boolean | null;
  images: { id: string; url: string; altText: string | null; sortOrder: number }[];
  brand?: { id: string; name: string; slug: string } | null;
}

export function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="py-16 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-2xl md:text-3xl font-normal text-white mb-10">
          You Might Also Like
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
          {products.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
