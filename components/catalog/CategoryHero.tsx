import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Breadcrumb {
  label: string;
  href: string;
}

interface CategoryHeroProps {
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  breadcrumbs: Breadcrumb[];
}

export function CategoryHero({ name, description, imageUrl, breadcrumbs }: CategoryHeroProps) {
  return (
    <div className="relative py-16 md:py-24 overflow-hidden">
      {imageUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70" />
        </>
      )}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-1.5 text-xs text-white/40 mb-6">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-3 h-3" />}
              <Link href={crumb.href} className="hover:text-primary transition-colors">
                {crumb.label}
              </Link>
            </span>
          ))}
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60">{name}</span>
        </nav>
        <h1 className="font-display text-4xl md:text-5xl font-normal text-white mb-4">{name}</h1>
        {description && (
          <p className="text-lg text-white/50 max-w-2xl">{description}</p>
        )}
      </div>
    </div>
  );
}
