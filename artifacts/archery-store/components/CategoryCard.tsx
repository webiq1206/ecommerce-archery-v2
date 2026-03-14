import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface CategoryCardProps {
  category: {
    name: string;
    slug: string;
    description?: string | null;
    imageUrl?: string | null;
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/products?category=${category.slug}`}
      className="group relative aspect-square rounded-3xl overflow-hidden bg-secondary"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
      {category.imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={category.imageUrl}
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-secondary via-primary/10 to-secondary/80 transition-transform duration-700 group-hover:scale-110" />
      )}
      <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
        <h3 className="text-white font-display text-2xl font-bold mb-2">{category.name}</h3>
        {category.description && (
          <p className="text-white/70 text-sm mb-2 line-clamp-2">{category.description}</p>
        )}
        <span className="text-primary font-medium flex items-center gap-2 group-hover:translate-x-2 transition-transform">
          Explore <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
