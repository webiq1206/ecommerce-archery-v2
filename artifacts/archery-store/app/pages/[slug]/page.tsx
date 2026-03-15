import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { db, flatPagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export const revalidate = 3600;

export async function generateStaticParams() {
  const pages = await db
    .select({ slug: flatPagesTable.slug })
    .from(flatPagesTable);
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [page] = await db
    .select()
    .from(flatPagesTable)
    .where(eq(flatPagesTable.slug, slug))
    .limit(1);
  if (!page) return { title: "Page Not Found" };
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDesc ?? undefined,
    openGraph: {
      title: page.seoTitle ?? page.title,
      description: page.seoDesc ?? undefined,
      url: `/pages/${slug}`,
      siteName: "Apex Archery",
    },
    alternates: { canonical: `/pages/${slug}` },
  };
}

export default async function FlatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [page] = await db
    .select()
    .from(flatPagesTable)
    .where(eq(flatPagesTable.slug, slug))
    .limit(1);

  if (!page) notFound();

  return (
    <div className="bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <nav className="flex items-center gap-2 text-sm text-secondary-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground">{page.title}</span>
        </nav>

        <h1 className="font-display text-4xl md:text-5xl font-normal text-foreground mb-10">
          {page.title}
        </h1>

        <div
          className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-a:text-primary prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: page.body }}
        />
      </div>
    </div>
  );
}
