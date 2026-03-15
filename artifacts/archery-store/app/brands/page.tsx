import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { db, brandsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";

export const metadata: Metadata = {
  title: "Brands | Apex Archery",
  description:
    "Shop premium archery brands. Mathews, Hoyt, Easton, and more. Quality gear from trusted manufacturers.",
  openGraph: {
    title: "Brands | Apex Archery",
    description: "Shop premium archery brands at Apex Archery.",
    url: "/brands",
    siteName: "Apex Archery",
  },
};

export default async function BrandsPage() {
  const brands = await db
    .select()
    .from(brandsTable)
    .where(eq(brandsTable.isActive, true))
    .orderBy(asc(brandsTable.name));

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <nav className="flex items-center gap-2 text-sm text-secondary-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">Brands</span>
        </nav>

        <header className="mb-14">
          <span className="text-secondary-foreground text-xs font-bold tracking-[0.2em] uppercase block mb-4">
            Shop by Brand
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-normal text-foreground">
            Our Brands
          </h1>
          <p className="text-secondary-foreground mt-4 max-w-2xl">
            Premium archery equipment from industry-leading manufacturers.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/products?brand=${brand.slug}`}
              className="group block bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-colors p-8"
            >
              {brand.logoUrl && (
                <div className="mb-6 h-16 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={brand.logoUrl}
                    alt={brand.name}
                    className="max-h-full w-auto object-contain object-center"
                  />
                </div>
              )}
              <h2 className="font-display text-xl text-foreground group-hover:text-primary transition-colors">
                {brand.name}
              </h2>
              {brand.description && (
                <p className="text-secondary-foreground text-sm mt-2 line-clamp-3">
                  {brand.description}
                </p>
              )}
            </Link>
          ))}
        </div>

        {brands.length === 0 && (
          <div className="text-center py-20">
            <p className="text-secondary-foreground">No brands available.</p>
          </div>
        )}
      </div>
    </div>
  );
}
