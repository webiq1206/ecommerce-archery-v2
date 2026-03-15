import type { Metadata } from "next";
import Link from "next/link";
import { db, buyingGuidesTable } from "@workspace/db";
import { desc } from "drizzle-orm";

export const metadata: Metadata = { title: "Buying Guides" };

async function getBuyingGuides() {
  return db.select().from(buyingGuidesTable).orderBy(desc(buyingGuidesTable.publishedAt), desc(buyingGuidesTable.createdAt));
}

export default async function AdminGuidesPage() {
  const guides = await getBuyingGuides();

  return (
    <>
      <h1 className="text-2xl font-display font-normal mb-8 text-gray-900">Buying Guides</h1>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        {guides.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No buying guides yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-gray-900">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 font-medium">Title</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Published</th>
                  <th className="text-right py-3 px-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guides.map((guide) => (
                  <tr key={guide.id} className="border-b border-gray-100">
                    <td className="py-3 px-4">{guide.title}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          guide.status === "PUBLISHED" ? "bg-green-100 text-green-700" : guide.status === "DRAFT" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {guide.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {guide.publishedAt ? new Date(guide.publishedAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/content/guides/${guide.id}`} className="text-primary hover:text-primary/80 text-sm font-medium">
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
