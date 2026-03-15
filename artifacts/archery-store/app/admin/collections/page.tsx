import type { Metadata } from "next";
import Link from "next/link";
import { db, collectionsTable, productCollectionsTable } from "@workspace/db";
import { asc, sql } from "drizzle-orm";

export const metadata: Metadata = { title: "Collections" };

async function getCollections() {
  const collections = await db.select().from(collectionsTable).orderBy(asc(collectionsTable.sortOrder), asc(collectionsTable.name));
  const counts = await db
    .select({ collectionId: productCollectionsTable.collectionId, count: sql<number>`count(*)::int` })
    .from(productCollectionsTable)
    .groupBy(productCollectionsTable.collectionId);
  const countMap = new Map(counts.map((c) => [c.collectionId, c.count]));
  return collections.map((col) => ({ ...col, productCount: countMap.get(col.id) ?? 0 }));
}

export default async function AdminCollectionsPage() {
  const collections = await getCollections();

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8 text-gray-900">Collections</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {collections.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No collections yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-900">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Slug</th>
                  <th className="text-left py-3 px-4 font-medium">Products</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((col) => (
                  <tr key={col.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">{col.name}</td>
                    <td className="py-3 px-4 text-gray-600">{col.slug}</td>
                    <td className="py-3 px-4">{col.productCount}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${col.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                        {col.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/collections/${col.id}`} className="text-primary hover:text-primary/80 text-sm font-medium">
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
