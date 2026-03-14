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
  const imageUrl = product.images?.[0]?.url || "https://placehold.co/600x800/1A1A1A/C8922A?text=Product";
  const hoverImageUrl = product.images?.[1]?.url || imageUrl;
  const isSale = product.compareAtPrice && parseFloat(product.compareAtPrice) > parseFloat(product.price);

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] bg-muted/30 rounded-2xl overflow-hidden mb-4">
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          {product.isNewArrival && (
            <span className="bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
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
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hoverImageUrl}
          alt={`${product.name} alternate view`}
          className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 scale-105 group-hover:scale-100"
        />
      </div>
      <div className="space-y-1">
        {product.brand && (
          <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {product.brand.name}
          </p>
        )}
        <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-medium">${product.price}</span>
          {isSale && (
            <span className="text-sm text-muted-foreground line-through">${product.compareAtPrice}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
