import Link from "next/link";

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    compareAtPrice?: string | null;
    isNewArrival?: boolean | null;
    isFeatured?: boolean | null;
    images: Array<{ id: string; url: string; altText: string | null; sortOrder: number }>;
    brand?: { id: string; name: string; slug: string } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images?.[0]?.url || "/images/product-bow-1.png";
  const isSale = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] bg-card rounded-xl overflow-hidden mb-4">
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {product.isNewArrival && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              New
            </span>
          )}
          {isSale && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
              Sale
            </span>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-center justify-center">
          <span className="text-white font-medium text-sm uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity duration-500 border border-white/50 px-6 py-3 rounded-lg backdrop-blur-sm">
            View Product
          </span>
        </div>
      </div>
      <div className="space-y-1 px-1">
        {product.brand && (
          <p className="text-xs font-semibold tracking-wider text-primary/70 uppercase">
            {product.brand.name}
          </p>
        )}
        <h3 className="font-display font-semibold text-lg text-white group-hover:text-primary transition-colors line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-medium text-white/90">${product.price}</span>
          {isSale && (
            <span className="text-sm text-muted-foreground line-through">${product.compareAtPrice}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
