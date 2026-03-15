import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { db, brandsTable, productsTable } from "@workspace/db";
import { asc, eq, sql } from "drizzle-orm";

export const metadata: Metadata = { title: "Brands" };

async function getBrands() {
  const brands = await db.select().from(brandsTable).orderBy(asc(brandsTable.name));
  const counts = await db
    .select({ brandId: productsTable.brandId, count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(sql`${productsTable.brandId} IS NOT NULL`)
    .groupBy(productsTable.brandId);
  const countMap = new Map(counts.map((c) => [c.brandId, c.count]));
  return brands.map((b) => ({ ...b, productCount: countMap.get(b.id) ?? 0 }));
}

export default async function AdminBrandsPage() {
  const brands = await getBrands();

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8 text-gray-900">Brands</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {brands.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No brands yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-900">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium">Logo</th>
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Slug</th>
                  <th className="text-left py-3 px-4 font-medium">Products</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">
                      {brand.logoUrl ? (
                        <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100">
                          <Image src={brand.logoUrl} alt={brand.name} fill className="object-contain" sizes="40px" />
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{brand.name}</td>
                    <td className="py-3 px-4 text-gray-600">{brand.slug}</td>
                    <td className="py-3 px-4">{brand.productCount}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${brand.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {brand.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/brands/${brand.id}`} className="text-primary hover:text-primary/80 text-sm font-medium">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
