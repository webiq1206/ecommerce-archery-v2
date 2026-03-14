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
      className="group relative aspect-[3/4] rounded-xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 z-10 group-hover:from-black/95 transition-all duration-500" />
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
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#222] to-[#111] transition-transform duration-700 group-hover:scale-110" />
      )}
      <div className="absolute bottom-0 left-0 p-8 z-20 w-full">
        <h3 className="text-white font-display text-2xl md:text-3xl font-bold mb-3">{category.name}</h3>
        {category.description && (
          <p className="text-white/60 text-sm mb-3 line-clamp-2">{category.description}</p>
        )}
        <span className="text-primary font-medium text-sm uppercase tracking-widest flex items-center gap-2 group-hover:translate-x-2 transition-transform duration-300">
          Explore <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
