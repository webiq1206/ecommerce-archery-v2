import Link from "next/link";

interface SubcategoryLinksProps {
  subcategories: { name: string; slug: string }[];
  basePath: string;
}

export function SubcategoryLinks({ subcategories, basePath }: SubcategoryLinksProps) {
  if (subcategories.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {subcategories.map((sub) => (
        <Link
          key={sub.slug}
          href={`${basePath}/${sub.slug}`}
          className="px-4 py-2 text-xs font-medium tracking-wider uppercase rounded-full border border-white/10 text-white/60 hover:border-primary hover:text-primary transition-colors"
        >
          {sub.name}
        </Link>
      ))}
    </div>
  );
}
